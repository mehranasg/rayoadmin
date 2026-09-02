using AlexChat.Web.Helper;
using Microsoft.Web.Http;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Net;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using System.Web.Http;
using Xanix.Framework;
using Xanix.Framework.Helper;

namespace AlexChat.Web.Controllers
{
    [EnableCorsAttribute]
    [EnableCORSPreflight]
    [ApiVersion("1.0")]
    [Route("api/v{version:apiVersion}/rayodata/{action}")]
    public class RayoDataController : ApiController
    {
        private const int MaxPageSize = 500;
        private const int MaxRememberedRequestIds = 200;

        private static readonly IReadOnlyDictionary<string, string> AllowedFiles =
            new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["suppliers"] = "suppliers-data.json",
                ["pricing"] = "pricing-data.json",
                ["inventory"] = "inventory-data.json",
                ["cashreport"] = "cash-report-data.json",
                ["assets"] = "assets-data.json",
                ["personnel"] = "personnel-data.json",
                ["finance"] = "finance-data.json",
                ["errorlog"] = "error-log-data.json",
                ["survey"] = "survey-data.json",
                ["sepidsaudit"] = "sepids-audit-data.json"
            };

        // Each module has its own lock. Mutations on personnel do not block inventory.
        private static readonly ConcurrentDictionary<string, SemaphoreSlim> ModuleLocks =
            new ConcurrentDictionary<string, SemaphoreSlim>(StringComparer.OrdinalIgnoreCase);

        private string ResolvePath(string module)
        {
            string fileName;
            if (string.IsNullOrWhiteSpace(module) || !AllowedFiles.TryGetValue(module, out fileName))
                throw new ArgumentOutOfRangeException(nameof(module), "Unknown module.");

            return FileHelper.VirtualToFullPath("/uploads/Rayo/" + fileName);
        }

        private static SemaphoreSlim GetModuleLock(string module)
        {
            return ModuleLocks.GetOrAdd(module, _ => new SemaphoreSlim(1, 1));
        }

        // Backward-compatible full document load.
        [HttpOptions]
        [HttpGet]
        public IHttpActionResult Load(string module, CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(module) || !AllowedFiles.ContainsKey(module))
                return Content(HttpStatusCode.BadRequest, new { code = "unknown_module", message = "Module not found." });

            var path = ResolvePath(module);
            if (!File.Exists(path))
                return Content(HttpStatusCode.NotFound, new { code = "data_not_found", message = "Module data file was not found.", module });

            try
            {
                var data = ReadJson(path);
                return Ok(data);
            }
            catch (JsonException ex)
            {
                return Content(HttpStatusCode.InternalServerError, new
                {
                    code = "invalid_server_json",
                    message = "The module JSON file is invalid.",
                    module,
                    detail = ex.Message
                });
            }
            catch (IOException ex)
            {
                return Content(HttpStatusCode.InternalServerError, new
                {
                    code = "read_failed",
                    message = "The module data could not be read.",
                    module,
                    detail = ex.Message
                });
            }
        }

        // Backward-compatible full document save. New screens should prefer Mutate.
        [HttpOptions]
        [HttpPost]
        public async Task<IHttpActionResult> Save(
            string module,
            [FromBody] JToken data,
            CancellationToken cancellationToken,
            long? expectedVersion = null)
        {
            if (string.IsNullOrWhiteSpace(module) || !AllowedFiles.ContainsKey(module))
                return Content(HttpStatusCode.BadRequest, new { code = "unknown_module", message = "Module not found." });

            if (data == null || data.Type == JTokenType.Null || data.Type == JTokenType.Undefined)
                return Content(HttpStatusCode.BadRequest, new { code = "empty_payload", message = "Save payload is empty." });

            var gate = GetModuleLock(module);
            await gate.WaitAsync(cancellationToken);

            try
            {
                var path = ResolvePath(module);
                var metadata = ReadMetadata(path);

                if (expectedVersion.HasValue && expectedVersion.Value != metadata.Version)
                {
                    return Content(HttpStatusCode.Conflict, new
                    {
                        code = "version_conflict",
                        message = "Server data changed after it was loaded.",
                        module,
                        expectedVersion,
                        currentVersion = metadata.Version
                    });
                }

                AtomicWriteJson(path, data);
                metadata.Version++;
                metadata.UpdatedAt = DateTimeOffset.UtcNow;
                metadata.DataLastWriteUtcTicks = File.GetLastWriteTimeUtc(path).Ticks;
                WriteMetadata(path, metadata);

                return Ok(new
                {
                    message = "Saved successfully.",
                    module,
                    version = metadata.Version,
                    updatedAt = metadata.UpdatedAt
                });
            }
            catch (IOException ex)
            {
                return Content(HttpStatusCode.InternalServerError, new
                {
                    code = "save_failed",
                    message = "The module data could not be saved.",
                    module,
                    detail = ex.Message
                });
            }
            finally
            {
                gate.Release();
            }
        }

        // Reads only one collection from a module and supports equality filters,
        // date range, sorting and pagination.
        [HttpOptions]
        [HttpPost]
        public IHttpActionResult Query([FromBody] RayoQueryRequest request, CancellationToken cancellationToken)
        {
            if (request == null)
                return Content(HttpStatusCode.BadRequest, new { code = "empty_request", message = "Query request is empty." });

            if (string.IsNullOrWhiteSpace(request.Module) || !AllowedFiles.ContainsKey(request.Module))
                return Content(HttpStatusCode.BadRequest, new { code = "unknown_module", message = "Module not found." });

            if (!IsValidCollectionPath(request.Collection))
                return Content(HttpStatusCode.BadRequest, new { code = "invalid_collection", message = "Collection path is invalid." });

            var page = request.Page < 1 ? 1 : request.Page;
            var pageSize = request.PageSize < 1 ? 100 : Math.Min(request.PageSize, MaxPageSize);
            var path = ResolvePath(request.Module);

            if (!File.Exists(path))
                return Content(HttpStatusCode.NotFound, new { code = "data_not_found", message = "Module data file was not found.", request.Module });

            try
            {
                var root = ReadJson(path) as JObject;
                if (root == null)
                    return Content(HttpStatusCode.Conflict, new { code = "invalid_root", message = "Query requires a JSON object at the module root." });

                var collection = GetCollection(root, request.Collection, false);
                var metadata = ReadMetadata(path);

                if (collection == null)
                {
                    return Ok(new
                    {
                        items = new JArray(),
                        page,
                        pageSize,
                        total = 0,
                        totalPages = 0,
                        version = metadata.Version,
                        updatedAt = metadata.UpdatedAt
                    });
                }

                IEnumerable<JObject> records = collection.OfType<JObject>();

                if (!request.IncludeArchived)
                    records = records.Where(x => !IsArchived(x));

                if (request.Filters != null)
                {
                    foreach (var filter in request.Filters.Properties())
                    {
                        var fieldName = filter.Name;
                        var expected = filter.Value;
                        records = records.Where(x => ValuesEqual(GetValue(x, fieldName), expected));
                    }
                }

                if (!string.IsNullOrWhiteSpace(request.DateField))
                {
                    if (!string.IsNullOrWhiteSpace(request.From))
                        records = records.Where(x => CompareTokenWithText(GetValue(x, request.DateField), request.From) >= 0);

                    if (!string.IsNullOrWhiteSpace(request.To))
                        records = records.Where(x => CompareTokenWithText(GetValue(x, request.DateField), request.To) <= 0);
                }

                var materialized = records.ToList();

                if (!string.IsNullOrWhiteSpace(request.SortBy))
                {
                    materialized = request.Descending
                        ? materialized.OrderByDescending(x => GetValue(x, request.SortBy), JTokenValueComparer.Instance).ToList()
                        : materialized.OrderBy(x => GetValue(x, request.SortBy), JTokenValueComparer.Instance).ToList();
                }

                var total = materialized.Count;
                var items = new JArray(materialized
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(x => x.DeepClone()));

                return Ok(new
                {
                    items,
                    page,
                    pageSize,
                    total,
                    totalPages = total == 0 ? 0 : (int)Math.Ceiling(total / (double)pageSize),
                    version = metadata.Version,
                    updatedAt = metadata.UpdatedAt
                });
            }
            catch (JsonException ex)
            {
                return Content(HttpStatusCode.InternalServerError, new
                {
                    code = "invalid_server_json",
                    message = "The module JSON file is invalid.",
                    request.Module,
                    detail = ex.Message
                });
            }
            catch (IOException ex)
            {
                return Content(HttpStatusCode.InternalServerError, new
                {
                    code = "query_failed",
                    message = "The requested data could not be read.",
                    request.Module,
                    detail = ex.Message
                });
            }
        }

        // Changes one record without sending the complete module JSON from the browser.
        [HttpOptions]
        [HttpPost]
        public async Task<IHttpActionResult> Mutate([FromBody] RayoMutateRequest request, CancellationToken cancellationToken)
        {
            if (request == null)
                return Content(HttpStatusCode.BadRequest, new { code = "empty_request", message = "Mutation request is empty." });

            if (string.IsNullOrWhiteSpace(request.Module) || !AllowedFiles.ContainsKey(request.Module))
                return Content(HttpStatusCode.BadRequest, new { code = "unknown_module", message = "Module not found." });

            if (!IsValidCollectionPath(request.Collection))
                return Content(HttpStatusCode.BadRequest, new { code = "invalid_collection", message = "Collection path is invalid." });

            if (string.IsNullOrWhiteSpace(request.RecordId))
                return Content(HttpStatusCode.BadRequest, new { code = "record_id_required", message = "RecordId is required." });

            if (string.IsNullOrWhiteSpace(request.RequestId))
                return Content(HttpStatusCode.BadRequest, new { code = "request_id_required", message = "RequestId is required." });

            if (!request.ExpectedVersion.HasValue)
                return Content(HttpStatusCode.BadRequest, new { code = "expected_version_required", message = "ExpectedVersion is required. Read it from Query first." });

            var operation = (request.Operation ?? string.Empty).Trim().ToLowerInvariant();
            if (operation != "insert" && operation != "update" && operation != "upsert" && operation != "archive")
                return Content(HttpStatusCode.BadRequest, new { code = "invalid_operation", message = "Allowed operations: insert, update, upsert, archive." });

            if (operation != "archive" && (request.Data == null || request.Data.Type != JTokenType.Object))
                return Content(HttpStatusCode.BadRequest, new { code = "invalid_data", message = "Data must be a JSON object." });

            var gate = GetModuleLock(request.Module);
            await gate.WaitAsync(cancellationToken);

            try
            {
                var path = ResolvePath(request.Module);
                if (!File.Exists(path))
                    return Content(HttpStatusCode.NotFound, new { code = "data_not_found", message = "Module data file was not found.", request.Module });

                var metadata = ReadMetadata(path);

                // Returning the earlier result makes client retries idempotent.
                if (metadata.ProcessedRequestIds.Any(x => string.Equals(x, request.RequestId, StringComparison.OrdinalIgnoreCase)))
                {
                    return Ok(new
                    {
                        message = "Request was already applied.",
                        duplicate = true,
                        request.Module,
                        request.Collection,
                        request.RecordId,
                        version = metadata.Version,
                        updatedAt = metadata.UpdatedAt
                    });
                }

                if (request.ExpectedVersion.Value != metadata.Version)
                {
                    return Content(HttpStatusCode.Conflict, new
                    {
                        code = "version_conflict",
                        message = "Server data changed after this collection was loaded. Query again before retrying.",
                        request.Module,
                        request.Collection,
                        expectedVersion = request.ExpectedVersion.Value,
                        currentVersion = metadata.Version
                    });
                }

                var root = ReadJson(path) as JObject;
                if (root == null)
                    return Content(HttpStatusCode.Conflict, new { code = "invalid_root", message = "Mutation requires a JSON object at the module root." });

                var collection = GetCollection(root, request.Collection, operation == "insert" || operation == "upsert");
                if (collection == null)
                    return Content(HttpStatusCode.NotFound, new { code = "collection_not_found", message = "Collection was not found." });

                var idField = string.IsNullOrWhiteSpace(request.IdField) ? "RecordID" : request.IdField.Trim();
                var existing = collection
                    .OfType<JObject>()
                    .FirstOrDefault(x => string.Equals(Convert.ToString(GetValue(x, idField), CultureInfo.InvariantCulture), request.RecordId, StringComparison.OrdinalIgnoreCase));

                JObject changedRecord;
                var now = DateTimeOffset.UtcNow;

                if (operation == "insert")
                {
                    if (existing != null)
                        return Content(HttpStatusCode.Conflict, new { code = "record_exists", message = "A record with the same ID already exists." });

                    changedRecord = (JObject)request.Data.DeepClone();
                    changedRecord[idField] = request.RecordId;
                    if (GetValue(changedRecord, "CreatedAt") == null)
                        changedRecord["CreatedAt"] = now;
                    changedRecord["UpdatedAt"] = now;
                    collection.Add(changedRecord);
                }
                else if (operation == "update")
                {
                    if (existing == null)
                        return Content(HttpStatusCode.NotFound, new { code = "record_not_found", message = "Record was not found." });

                    existing.Merge(request.Data, new JsonMergeSettings
                    {
                        MergeArrayHandling = MergeArrayHandling.Replace,
                        MergeNullValueHandling = MergeNullValueHandling.Merge
                    });
                    existing[idField] = request.RecordId;
                    existing["UpdatedAt"] = now;
                    changedRecord = existing;
                }
                else if (operation == "upsert")
                {
                    if (existing == null)
                    {
                        changedRecord = (JObject)request.Data.DeepClone();
                        changedRecord[idField] = request.RecordId;
                        if (GetValue(changedRecord, "CreatedAt") == null)
                            changedRecord["CreatedAt"] = now;
                        changedRecord["UpdatedAt"] = now;
                        collection.Add(changedRecord);
                    }
                    else
                    {
                        existing.Merge(request.Data, new JsonMergeSettings
                        {
                            MergeArrayHandling = MergeArrayHandling.Replace,
                            MergeNullValueHandling = MergeNullValueHandling.Merge
                        });
                        existing[idField] = request.RecordId;
                        existing["UpdatedAt"] = now;
                        changedRecord = existing;
                    }
                }
                else
                {
                    if (existing == null)
                        return Content(HttpStatusCode.NotFound, new { code = "record_not_found", message = "Record was not found." });

                    existing["IsArchived"] = true;
                    existing["UpdatedAt"] = now;
                    changedRecord = existing;
                }

                AtomicWriteJson(path, root);

                metadata.Version++;
                metadata.UpdatedAt = now;
                metadata.DataLastWriteUtcTicks = File.GetLastWriteTimeUtc(path).Ticks;
                metadata.ProcessedRequestIds.Add(request.RequestId);
                if (metadata.ProcessedRequestIds.Count > MaxRememberedRequestIds)
                {
                    metadata.ProcessedRequestIds.RemoveRange(
                        0,
                        metadata.ProcessedRequestIds.Count - MaxRememberedRequestIds);
                }
                WriteMetadata(path, metadata);

                return Ok(new
                {
                    message = "Mutation applied successfully.",
                    duplicate = false,
                    request.Module,
                    request.Collection,
                    request.RecordId,
                    operation,
                    record = changedRecord,
                    version = metadata.Version,
                    updatedAt = metadata.UpdatedAt
                });
            }
            catch (JsonException ex)
            {
                return Content(HttpStatusCode.InternalServerError, new
                {
                    code = "invalid_server_json",
                    message = "The module JSON file is invalid.",
                    request.Module,
                    detail = ex.Message
                });
            }
            catch (IOException ex)
            {
                return Content(HttpStatusCode.InternalServerError, new
                {
                    code = "mutation_failed",
                    message = "The mutation could not be saved.",
                    request.Module,
                    detail = ex.Message
                });
            }
            finally
            {
                gate.Release();
            }
        }

        private static JToken ReadJson(string path)
        {
            var json = File.ReadAllText(path, Encoding.UTF8);
            if (string.IsNullOrWhiteSpace(json))
                throw new JsonReaderException("JSON file is empty.");

            return JToken.Parse(json);
        }

        private static void AtomicWriteJson(string path, JToken data)
        {
            var directory = Path.GetDirectoryName(path);
            if (string.IsNullOrWhiteSpace(directory))
                throw new IOException("The module directory could not be resolved.");

            Directory.CreateDirectory(directory);
            var tempPath = path + "." + Guid.NewGuid().ToString("N") + ".tmp";

            try
            {
                File.WriteAllText(tempPath, data.ToString(Formatting.None), new UTF8Encoding(false));

                if (File.Exists(path))
                    File.Replace(tempPath, path, null, true);
                else
                    File.Move(tempPath, path);
            }
            finally
            {
                if (File.Exists(tempPath))
                    File.Delete(tempPath);
            }
        }

        private static string GetMetadataPath(string dataPath)
        {
            return dataPath + ".meta.json";
        }

        private static RayoModuleMetadata ReadMetadata(string dataPath)
        {
            var currentTicks = File.Exists(dataPath) ? File.GetLastWriteTimeUtc(dataPath).Ticks : 0;
            var metadataPath = GetMetadataPath(dataPath);
            RayoModuleMetadata metadata = null;

            if (File.Exists(metadataPath))
            {
                try
                {
                    metadata = JsonConvert.DeserializeObject<RayoModuleMetadata>(File.ReadAllText(metadataPath, Encoding.UTF8));
                }
                catch (JsonException)
                {
                    // A damaged metadata sidecar must never damage the operational data.
                    metadata = null;
                }
            }

            if (metadata == null)
            {
                metadata = new RayoModuleMetadata
                {
                    Version = File.Exists(dataPath) ? 1 : 0,
                    UpdatedAt = File.Exists(dataPath)
                        ? new DateTimeOffset(File.GetLastWriteTimeUtc(dataPath), TimeSpan.Zero)
                        : DateTimeOffset.MinValue,
                    DataLastWriteUtcTicks = currentTicks,
                    ProcessedRequestIds = new List<string>()
                };
            }

            if (metadata.ProcessedRequestIds == null)
                metadata.ProcessedRequestIds = new List<string>();

            // Detect writes made by old code or manual file replacement.
            if (metadata.DataLastWriteUtcTicks != 0 && currentTicks != 0 && metadata.DataLastWriteUtcTicks != currentTicks)
            {
                metadata.Version++;
                metadata.UpdatedAt = new DateTimeOffset(File.GetLastWriteTimeUtc(dataPath), TimeSpan.Zero);
                metadata.DataLastWriteUtcTicks = currentTicks;
                metadata.ProcessedRequestIds.Clear();
            }

            return metadata;
        }

        private static void WriteMetadata(string dataPath, RayoModuleMetadata metadata)
        {
            var metadataToken = JObject.FromObject(metadata);
            AtomicWriteJson(GetMetadataPath(dataPath), metadataToken);
        }

        private static bool IsValidCollectionPath(string collection)
        {
            if (string.IsNullOrWhiteSpace(collection) || collection.Length > 200)
                return false;

            var segments = collection.Split('.');
            if (segments.Length == 0 || segments.Length > 10)
                return false;

            return segments.All(segment =>
                !string.IsNullOrWhiteSpace(segment) &&
                segment.Length <= 80 &&
                segment.All(ch => char.IsLetterOrDigit(ch) || ch == '_' || ch == '-'));
        }

        private static JArray GetCollection(JObject root, string collectionPath, bool create)
        {
            var segments = collectionPath.Split('.');
            JObject current = root;

            for (var i = 0; i < segments.Length - 1; i++)
            {
                var next = GetValue(current, segments[i]);
                if (next == null)
                {
                    if (!create)
                        return null;

                    var created = new JObject();
                    current[segments[i]] = created;
                    current = created;
                    continue;
                }

                current = next as JObject;
                if (current == null)
                    return null;
            }

            var finalName = segments[segments.Length - 1];
            var finalToken = GetValue(current, finalName);

            if (finalToken == null && create)
            {
                var createdArray = new JArray();
                current[finalName] = createdArray;
                return createdArray;
            }

            return finalToken as JArray;
        }

        private static JToken GetValue(JObject source, string fieldName)
        {
            if (source == null || string.IsNullOrWhiteSpace(fieldName))
                return null;

            return source.GetValue(fieldName, StringComparison.OrdinalIgnoreCase);
        }

        private static bool IsArchived(JObject record)
        {
            var token = GetValue(record, "IsArchived");
            if (token == null || token.Type == JTokenType.Null)
                return false;

            bool booleanValue;
            if (bool.TryParse(token.ToString(), out booleanValue))
                return booleanValue;

            int integerValue;
            return int.TryParse(token.ToString(), out integerValue) && integerValue != 0;
        }

        private static bool ValuesEqual(JToken actual, JToken expected)
        {
            if (actual == null || actual.Type == JTokenType.Null)
                return expected == null || expected.Type == JTokenType.Null;

            if (expected == null || expected.Type == JTokenType.Null)
                return false;

            decimal actualNumber;
            decimal expectedNumber;
            if (decimal.TryParse(actual.ToString(), NumberStyles.Any, CultureInfo.InvariantCulture, out actualNumber) &&
                decimal.TryParse(expected.ToString(), NumberStyles.Any, CultureInfo.InvariantCulture, out expectedNumber))
                return actualNumber == expectedNumber;

            return string.Equals(actual.ToString(), expected.ToString(), StringComparison.OrdinalIgnoreCase);
        }

        // For zero-padded dates such as 1405-06-05 or ISO dates, ordinal comparison is reliable.
        private static int CompareTokenWithText(JToken token, string text)
        {
            if (token == null || token.Type == JTokenType.Null)
                return -1;

            return StringComparer.OrdinalIgnoreCase.Compare(token.ToString(), text ?? string.Empty);
        }

        private sealed class JTokenValueComparer : IComparer<JToken>
        {
            public static readonly JTokenValueComparer Instance = new JTokenValueComparer();

            public int Compare(JToken x, JToken y)
            {
                if (ReferenceEquals(x, y)) return 0;
                if (x == null || x.Type == JTokenType.Null) return -1;
                if (y == null || y.Type == JTokenType.Null) return 1;

                decimal xNumber;
                decimal yNumber;
                if (decimal.TryParse(x.ToString(), NumberStyles.Any, CultureInfo.InvariantCulture, out xNumber) &&
                    decimal.TryParse(y.ToString(), NumberStyles.Any, CultureInfo.InvariantCulture, out yNumber))
                    return xNumber.CompareTo(yNumber);

                return StringComparer.OrdinalIgnoreCase.Compare(x.ToString(), y.ToString());
            }
        }
    }

    public sealed class RayoQueryRequest
    {
        public string Module { get; set; }
        public string Collection { get; set; }
        public JObject Filters { get; set; }
        public string DateField { get; set; }
        public string From { get; set; }
        public string To { get; set; }
        public string SortBy { get; set; }
        public bool Descending { get; set; }
        public bool IncludeArchived { get; set; }
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 100;
    }

    public sealed class RayoMutateRequest
    {
        public string Module { get; set; }
        public string Collection { get; set; }
        public string Operation { get; set; }
        public string RecordId { get; set; }
        public string IdField { get; set; } = "RecordID";
        public JObject Data { get; set; }
        public long? ExpectedVersion { get; set; }
        public string RequestId { get; set; }
    }

    public sealed class RayoModuleMetadata
    {
        public long Version { get; set; }
        public DateTimeOffset UpdatedAt { get; set; }
        public long DataLastWriteUtcTicks { get; set; }
        public List<string> ProcessedRequestIds { get; set; } = new List<string>();
    }
}
