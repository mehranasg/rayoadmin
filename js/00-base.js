'use strict';
const APP_CONFIG={
  storageMode:'api',storageKey:'rayo_hr_payroll_v2',
  api:{loadUrl:window.RAYO_CONFIG?.hr?.loadUrl,saveUrl:window.RAYO_CONFIG?.hr?.saveUrl,timeoutMs:window.RAYO_CONFIG?.timeoutMs||30000,verifyAfterSave:window.RAYO_CONFIG?.verifyAfterSave??true}
};
const DEFAULT_DATA={
  "meta": {
    "schemaVersion": "2.4.0",
    "appName": "Rayo HR, Payroll & Salary Model",
    "restaurant": "کافه‌رستوران رایو",
    "updatedAt": null,
    "source": "Rayo HR Dashboard + Salary Calculator + Staffing Taxonomy + Leave Balance + Staff Viewer"
  },
  "settings": {
    "restaurantName": "رایو",
    "baseHourlyRate": 100000,
    "overtimeFactor": 1.4,
    "holidayFactor": 1.4,
    "weeksPerMonth": 4.333,
    "monthlyBudget": 700000000,
    "salaryCeiling": 50000000,
    "performanceMax": 5000000,
    "defaultTransport": 0,
    "employeeInsuranceRate": 0.07,
    "defaultMonthlyCredit": 0,
    "defaultMealCredit": 0,
    "delayDeductionFactor": 1,
    "tomanToRial": 10,
    "morningHours": 7,
    "eveningHours": 8,
    "doubleShiftBreakHours": 2,
    "leaveBalanceStartDate": "1405/05/01",
    "monthlyLeaveEntitlementDays": 2.5
  },
  "lists": {
    "positions": [
      "سالن‌کار",
      "ویتر",
      "هاست",
      "صندوقدار",
      "باریستا",
      "قلیان‌زن",
      "پیک",
      "پارک‌بان",
      "مدیر/سرپرست",
      "سرآشپز",
      "آماده‌ساز",
      "تخته‌کار",
      "وسط‌کار",
      "ظرفشور",
      "سالادزن",
      "ساندویچ‌زن",
      "پاستازن",
      "گریل‌کار",
      "پیتزازن",
      "فیش‌خوان",
      "خدماتی"
    ],
    "sections": [
      "بار",
      "صندوق",
      "هاست",
      "سالن بالا",
      "قلیان‌خانه",
      "سالن پایین",
      "پیک",
      "پارکینگ",
      "آشپزخانه",
      "خدمات"
    ],
    "nationalities": [
      "ایرانی",
      "اتباع"
    ],
    "insuranceStatuses": [
      "دارد",
      "ندارد"
    ],
    "employmentTypes": [
      "تک‌شیفت",
      "دوشیفت",
      "ساعتی",
      "پاره‌وقت"
    ],
    "employmentStatuses": [
      "فعال",
      "مرخصی",
      "غیرفعال",
      "اتمام همکاری"
    ],
    "paymentTypes": [
      "مساعده",
      "علی‌الحساب حقوق",
      "تسویه حقوق",
      "پرداخت انعام",
      "اصلاح پرداخت"
    ],
    "paymentMethods": [
      "نقدی",
      "کارت به کارت",
      "واریز به حساب",
      "کسر از صندوق",
      "سایر"
    ],
    "tipTypes": [
      "فردی",
      "سالن",
      "کلی"
    ],
    "hallGroups": [],
    "tipStatuses": [
      "ثبت‌شده",
      "تسویه جزئی",
      "تسویه‌شده",
      "ابطال‌شده"
    ],
    "delayTypes": [
      "شروع شیفت",
      "بازگشت از رست"
    ],
    "shifts": [
      "صبح",
      "عصر"
    ],
    "consumptionTypes": [
      "اعتبار",
      "غذای پرسنلی"
    ],
    "settlementMethods": [
      "نقدی",
      "کارت به کارت",
      "واریز به حساب",
      "همراه حقوق",
      "سایر"
    ],
    "months": [
      "فروردین",
      "اردیبهشت",
      "خرداد",
      "تیر",
      "مرداد",
      "شهریور",
      "مهر",
      "آبان",
      "آذر",
      "دی",
      "بهمن",
      "اسفند"
    ],
    "penaltyRewardTypes": [
      "جریمه",
      "تشویقی"
    ],
    "approvalStatuses": [
      "پیش‌نویس",
      "تاییدشده",
      "لغوشده"
    ],
    "shiftStatuses": [
      "برنامه‌ریزی‌شده",
      "انجام‌شده",
      "مرخصی",
      "غیبت",
      "لغوشده"
    ],
    "weekdays": [
      "شنبه",
      "یکشنبه",
      "دوشنبه",
      "سه‌شنبه",
      "چهارشنبه",
      "پنجشنبه",
      "جمعه"
    ],
    "leaveTypes": [
      "مرخصی استحقاقی",
      "مرخصی بدون حقوق",
      "مریضی",
      "غیبت",
      "ماموریت"
    ],
    "personnelGroups": [
      "سالن",
      "آشپزخانه",
      "خدمات"
    ],
    "hallSections": [
      "بار",
      "صندوق",
      "هاست",
      "سالن بالا",
      "قلیان‌خانه",
      "سالن پایین",
      "پیک",
      "پارکینگ"
    ],
    "kitchenStations": [
      "آماده‌ساز",
      "تخته‌کار",
      "وسط‌کار",
      "ظرفشور",
      "سالادزن",
      "ساندویچ‌زن",
      "پاستازن",
      "گریل‌کار",
      "پیتزازن",
      "فیش‌خوان"
    ],
    "kitchenRanks": [
      "سرآشپز",
      "آشپز",
      "کمک‌آشپز",
      "سایر"
    ],
    "serviceSections": [
      "خدمات"
    ]
  },
  "personnel": [
    {
      "id": "EMP-0001",
      "name": "مایا",
      "mainPosition": "ویتر",
      "backupPosition": "سالن‌کار",
      "nationality": "",
      "insurance": "",
      "startDate": "",
      "phone": "",
      "employmentType": "دوشیفت",
      "status": "فعال",
      "transportMonthly": 0,
      "fixedAllowance": 0,
      "section": "سالن پایین",
      "hourlyRate": 0,
      "notes": "",
      "monthlyCredit": 0,
      "mealCredit": 0,
      "gradeId": "D",
      "experienceMonths": 0,
      "salaryProfile": {
        "position": "ویتر",
        "grade": "D",
        "experienceMonths": 0,
        "schedule": {
          "weekdayMorning": 0,
          "weekdayEvening": 0,
          "thursdayMorning": 0,
          "thursdayEvening": 0,
          "fridayMorning": 0,
          "fridayEvening": 0,
          "fullWeekday": 0,
          "fullThursday": 0,
          "fullFriday": 0
        },
        "returnAid": 0,
        "incentive": 0,
        "contractMonthly": 0,
        "updatedAt": null,
        "calculationMonth": 1
      },
      "personnelGroup": "سالن",
      "kitchenRank": ""
    },
    {
      "id": "EMP-0002",
      "name": "محمد",
      "mainPosition": "ویتر",
      "backupPosition": "سالن‌کار",
      "nationality": "",
      "insurance": "",
      "startDate": "",
      "phone": "",
      "employmentType": "دوشیفت",
      "status": "فعال",
      "transportMonthly": 0,
      "fixedAllowance": 0,
      "section": "سالن پایین",
      "hourlyRate": 0,
      "notes": "",
      "monthlyCredit": 0,
      "mealCredit": 0,
      "gradeId": "D",
      "experienceMonths": 0,
      "salaryProfile": {
        "position": "ویتر",
        "grade": "D",
        "experienceMonths": 0,
        "schedule": {
          "weekdayMorning": 0,
          "weekdayEvening": 0,
          "thursdayMorning": 0,
          "thursdayEvening": 0,
          "fridayMorning": 0,
          "fridayEvening": 0,
          "fullWeekday": 0,
          "fullThursday": 0,
          "fullFriday": 0
        },
        "returnAid": 0,
        "incentive": 0,
        "contractMonthly": 0,
        "updatedAt": null,
        "calculationMonth": 1
      },
      "personnelGroup": "سالن",
      "kitchenRank": ""
    },
    {
      "id": "EMP-0003",
      "name": "محمدباقر",
      "mainPosition": "ویتر",
      "backupPosition": "",
      "nationality": "",
      "insurance": "",
      "startDate": "",
      "phone": "",
      "employmentType": "تک‌شیفت",
      "status": "فعال",
      "transportMonthly": 0,
      "fixedAllowance": 0,
      "section": "سالن پایین",
      "hourlyRate": 0,
      "notes": "",
      "monthlyCredit": 0,
      "mealCredit": 0,
      "gradeId": "D",
      "experienceMonths": 0,
      "salaryProfile": {
        "position": "ویتر",
        "grade": "D",
        "experienceMonths": 0,
        "schedule": {
          "weekdayMorning": 0,
          "weekdayEvening": 0,
          "thursdayMorning": 0,
          "thursdayEvening": 0,
          "fridayMorning": 0,
          "fridayEvening": 0,
          "fullWeekday": 0,
          "fullThursday": 0,
          "fullFriday": 0
        },
        "returnAid": 0,
        "incentive": 0,
        "contractMonthly": 0,
        "updatedAt": null,
        "calculationMonth": 1
      },
      "personnelGroup": "سالن",
      "kitchenRank": ""
    },
    {
      "id": "EMP-0004",
      "name": "فرشید",
      "mainPosition": "سالن‌کار",
      "backupPosition": "ویتر",
      "nationality": "",
      "insurance": "",
      "startDate": "",
      "phone": "",
      "employmentType": "دوشیفت",
      "status": "فعال",
      "transportMonthly": 0,
      "fixedAllowance": 0,
      "section": "سالن پایین",
      "hourlyRate": 0,
      "notes": "",
      "monthlyCredit": 0,
      "mealCredit": 0,
      "gradeId": "D",
      "experienceMonths": 0,
      "salaryProfile": {
        "position": "سالن‌کار",
        "grade": "D",
        "experienceMonths": 0,
        "schedule": {
          "weekdayMorning": 0,
          "weekdayEvening": 0,
          "thursdayMorning": 0,
          "thursdayEvening": 0,
          "fridayMorning": 0,
          "fridayEvening": 0,
          "fullWeekday": 0,
          "fullThursday": 0,
          "fullFriday": 0
        },
        "returnAid": 0,
        "incentive": 0,
        "contractMonthly": 0,
        "updatedAt": null,
        "calculationMonth": 1
      },
      "personnelGroup": "سالن",
      "kitchenRank": ""
    },
    {
      "id": "EMP-0005",
      "name": "کیارش",
      "mainPosition": "سالن‌کار",
      "backupPosition": "",
      "nationality": "",
      "insurance": "",
      "startDate": "",
      "phone": "",
      "employmentType": "تک‌شیفت",
      "status": "فعال",
      "transportMonthly": 0,
      "fixedAllowance": 0,
      "section": "سالن پایین",
      "hourlyRate": 0,
      "notes": "",
      "monthlyCredit": 0,
      "mealCredit": 0,
      "gradeId": "D",
      "experienceMonths": 0,
      "salaryProfile": {
        "position": "سالن‌کار",
        "grade": "D",
        "experienceMonths": 0,
        "schedule": {
          "weekdayMorning": 0,
          "weekdayEvening": 0,
          "thursdayMorning": 0,
          "thursdayEvening": 0,
          "fridayMorning": 0,
          "fridayEvening": 0,
          "fullWeekday": 0,
          "fullThursday": 0,
          "fullFriday": 0
        },
        "returnAid": 0,
        "incentive": 0,
        "contractMonthly": 0,
        "updatedAt": null,
        "calculationMonth": 1
      },
      "personnelGroup": "سالن",
      "kitchenRank": ""
    },
    {
      "id": "EMP-0006",
      "name": "ابوالفضل",
      "mainPosition": "سالن‌کار",
      "backupPosition": "",
      "nationality": "",
      "insurance": "",
      "startDate": "",
      "phone": "",
      "employmentType": "تک‌شیفت",
      "status": "فعال",
      "transportMonthly": 0,
      "fixedAllowance": 0,
      "section": "سالن پایین",
      "hourlyRate": 0,
      "notes": "",
      "monthlyCredit": 0,
      "mealCredit": 0,
      "gradeId": "D",
      "experienceMonths": 0,
      "salaryProfile": {
        "position": "سالن‌کار",
        "grade": "D",
        "experienceMonths": 0,
        "schedule": {
          "weekdayMorning": 0,
          "weekdayEvening": 0,
          "thursdayMorning": 0,
          "thursdayEvening": 0,
          "fridayMorning": 0,
          "fridayEvening": 0,
          "fullWeekday": 0,
          "fullThursday": 0,
          "fullFriday": 0
        },
        "returnAid": 0,
        "incentive": 0,
        "contractMonthly": 0,
        "updatedAt": null,
        "calculationMonth": 1
      },
      "personnelGroup": "سالن",
      "kitchenRank": ""
    },
    {
      "id": "EMP-0007",
      "name": "تارا",
      "mainPosition": "صندوقدار",
      "backupPosition": "باریستا",
      "nationality": "",
      "insurance": "",
      "startDate": "",
      "phone": "",
      "employmentType": "دوشیفت",
      "status": "فعال",
      "transportMonthly": 0,
      "fixedAllowance": 0,
      "section": "صندوق",
      "hourlyRate": 0,
      "notes": "",
      "monthlyCredit": 0,
      "mealCredit": 0,
      "gradeId": "D",
      "experienceMonths": 0,
      "salaryProfile": {
        "position": "صندوقدار",
        "grade": "D",
        "experienceMonths": 0,
        "schedule": {
          "weekdayMorning": 0,
          "weekdayEvening": 0,
          "thursdayMorning": 0,
          "thursdayEvening": 0,
          "fridayMorning": 0,
          "fridayEvening": 0,
          "fullWeekday": 0,
          "fullThursday": 0,
          "fullFriday": 0
        },
        "returnAid": 0,
        "incentive": 0,
        "contractMonthly": 0,
        "updatedAt": null,
        "calculationMonth": 1
      },
      "personnelGroup": "سالن",
      "kitchenRank": ""
    },
    {
      "id": "EMP-0008",
      "name": "فرشته",
      "mainPosition": "صندوقدار",
      "backupPosition": "",
      "nationality": "",
      "insurance": "",
      "startDate": "",
      "phone": "",
      "employmentType": "دوشیفت",
      "status": "فعال",
      "transportMonthly": 0,
      "fixedAllowance": 0,
      "section": "صندوق",
      "hourlyRate": 0,
      "notes": "",
      "monthlyCredit": 0,
      "mealCredit": 0,
      "gradeId": "D",
      "experienceMonths": 0,
      "salaryProfile": {
        "position": "صندوقدار",
        "grade": "D",
        "experienceMonths": 0,
        "schedule": {
          "weekdayMorning": 0,
          "weekdayEvening": 0,
          "thursdayMorning": 0,
          "thursdayEvening": 0,
          "fridayMorning": 0,
          "fridayEvening": 0,
          "fullWeekday": 0,
          "fullThursday": 0,
          "fullFriday": 0
        },
        "returnAid": 0,
        "incentive": 0,
        "contractMonthly": 0,
        "updatedAt": null,
        "calculationMonth": 1
      },
      "personnelGroup": "سالن",
      "kitchenRank": ""
    },
    {
      "id": "EMP-0009",
      "name": "الهام",
      "mainPosition": "باریستا",
      "backupPosition": "",
      "nationality": "",
      "insurance": "",
      "startDate": "",
      "phone": "",
      "employmentType": "تک‌شیفت",
      "status": "فعال",
      "transportMonthly": 0,
      "fixedAllowance": 0,
      "section": "بار",
      "hourlyRate": 0,
      "notes": "",
      "monthlyCredit": 0,
      "mealCredit": 0,
      "gradeId": "D",
      "experienceMonths": 0,
      "salaryProfile": {
        "position": "باریستا",
        "grade": "D",
        "experienceMonths": 0,
        "schedule": {
          "weekdayMorning": 0,
          "weekdayEvening": 0,
          "thursdayMorning": 0,
          "thursdayEvening": 0,
          "fridayMorning": 0,
          "fridayEvening": 0,
          "fullWeekday": 0,
          "fullThursday": 0,
          "fullFriday": 0
        },
        "returnAid": 0,
        "incentive": 0,
        "contractMonthly": 0,
        "updatedAt": null,
        "calculationMonth": 1
      },
      "personnelGroup": "سالن",
      "kitchenRank": ""
    },
    {
      "id": "EMP-0010",
      "name": "ملیکا",
      "mainPosition": "باریستا",
      "backupPosition": "",
      "nationality": "",
      "insurance": "",
      "startDate": "",
      "phone": "",
      "employmentType": "دوشیفت",
      "status": "فعال",
      "transportMonthly": 0,
      "fixedAllowance": 0,
      "section": "بار",
      "hourlyRate": 0,
      "notes": "",
      "monthlyCredit": 0,
      "mealCredit": 0,
      "gradeId": "D",
      "experienceMonths": 0,
      "salaryProfile": {
        "position": "باریستا",
        "grade": "D",
        "experienceMonths": 0,
        "schedule": {
          "weekdayMorning": 0,
          "weekdayEvening": 0,
          "thursdayMorning": 0,
          "thursdayEvening": 0,
          "fridayMorning": 0,
          "fridayEvening": 0,
          "fullWeekday": 0,
          "fullThursday": 0,
          "fullFriday": 0
        },
        "returnAid": 0,
        "incentive": 0,
        "contractMonthly": 0,
        "updatedAt": null,
        "calculationMonth": 1
      },
      "personnelGroup": "سالن",
      "kitchenRank": ""
    },
    {
      "id": "EMP-0011",
      "name": "احسان",
      "mainPosition": "خدماتی",
      "backupPosition": "ظرفشور",
      "nationality": "",
      "insurance": "",
      "startDate": "",
      "phone": "",
      "employmentType": "دوشیفت",
      "status": "فعال",
      "transportMonthly": 0,
      "fixedAllowance": 0,
      "section": "خدمات",
      "hourlyRate": 0,
      "notes": "",
      "monthlyCredit": 0,
      "mealCredit": 0,
      "gradeId": "D",
      "experienceMonths": 0,
      "salaryProfile": {
        "position": "خدماتی",
        "grade": "D",
        "experienceMonths": 0,
        "schedule": {
          "weekdayMorning": 0,
          "weekdayEvening": 0,
          "thursdayMorning": 0,
          "thursdayEvening": 0,
          "fridayMorning": 0,
          "fridayEvening": 0,
          "fullWeekday": 0,
          "fullThursday": 0,
          "fullFriday": 0
        },
        "returnAid": 0,
        "incentive": 0,
        "contractMonthly": 0,
        "updatedAt": null,
        "calculationMonth": 1
      },
      "personnelGroup": "خدمات",
      "kitchenRank": ""
    },
    {
      "id": "EMP-0012",
      "name": "فرید",
      "mainPosition": "خدماتی",
      "backupPosition": "ظرفشور",
      "nationality": "",
      "insurance": "",
      "startDate": "",
      "phone": "",
      "employmentType": "تک‌شیفت",
      "status": "فعال",
      "transportMonthly": 0,
      "fixedAllowance": 0,
      "section": "خدمات",
      "hourlyRate": 0,
      "notes": "",
      "monthlyCredit": 0,
      "mealCredit": 0,
      "gradeId": "D",
      "experienceMonths": 0,
      "salaryProfile": {
        "position": "خدماتی",
        "grade": "D",
        "experienceMonths": 0,
        "schedule": {
          "weekdayMorning": 0,
          "weekdayEvening": 0,
          "thursdayMorning": 0,
          "thursdayEvening": 0,
          "fridayMorning": 0,
          "fridayEvening": 0,
          "fullWeekday": 0,
          "fullThursday": 0,
          "fullFriday": 0
        },
        "returnAid": 0,
        "incentive": 0,
        "contractMonthly": 0,
        "updatedAt": null,
        "calculationMonth": 1
      },
      "personnelGroup": "خدمات",
      "kitchenRank": ""
    }
  ],
  "weeklyPlans": [],
  "shiftRecords": [],
  "monthlyAdjustments": [],
  "tipGroups": [],
  "penaltiesRewards": [],
  "delays": [],
  "payments": [],
  "consumptions": [],
  "leaves": [],
  "changeLog": [],
  "salaryModel": {
    "schemaVersion": "1.0.0",
    "laborMonthlyBase": 19065200,
    "standardWeeklyHours": 44,
    "weeksPerMonth": 4.333,
    "experienceStepPercent": 2,
    "roundingStep": 500,
    "workHours": {
      "weekdayMorning": 7,
      "weekdayEvening": 8,
      "thursdayMorning": 8.5,
      "thursdayEvening": 9,
      "fridayMorning": 8.5,
      "fridayEvening": 8,
      "fullWeekday": 13,
      "fullThursday": 15,
      "fullFriday": 13
    },
    "positionCoefficients": {
      "سالن‌کار": 1.0,
      "ویتر": 1.1,
      "هاست": 1.0,
      "صندوقدار": 1.1,
      "باریستا": 1.15,
      "قلیان‌زن": 1.1,
      "پیک": 1.0,
      "پارک‌بان": 1.0,
      "مدیر/سرپرست": 1.4,
      "سرآشپز": 1.6,
      "آماده‌ساز": 1.05,
      "تخته‌کار": 1.25,
      "وسط‌کار": 1.35,
      "ظرفشور": 1.0,
      "سالادزن": 1.2,
      "ساندویچ‌زن": 1.3,
      "پاستازن": 1.35,
      "گریل‌کار": 1.4,
      "پیتزازن": 1.35,
      "فیش‌خوان": 1.2,
      "خدماتی": 1.0
    },
    "gradeCoefficients": {
      "A": 1.15,
      "B": 1.1,
      "C": 1.05,
      "D": 1.0
    },
    "draft": {
      "personnelId": "",
      "position": "بار",
      "grade": "D",
      "experienceMonths": 0,
      "schedule": {
        "weekdayMorning": 0,
        "weekdayEvening": 4,
        "thursdayMorning": 0,
        "thursdayEvening": 1,
        "fridayMorning": 0,
        "fridayEvening": 1,
        "fullWeekday": 0,
        "fullThursday": 0,
        "fullFriday": 0
      },
      "returnAid": 0,
      "incentive": 0,
      "contractMonthly": 0,
      "quickMonthlyHours": 190,
      "quickHourlyRate": 100000,
      "quickMonthlySalary": 19000000,
      "quickMode": "hourly",
      "targetHourly": 180000,
      "targetPosition": "بار",
      "targetGrade": "A",
      "targetExperienceMonths": 36,
      "gradeShare": 50,
      "ratePosition": "",
      "rateGrade": "",
      "rateMaxMonths": 60,
      "reverseMode": "monthly",
      "reverseFinalMonthly": 0,
      "reversePosition": "بار",
      "reverseGrade": "D",
      "reverseExperienceMonths": 0,
      "reverseSchedule": {
        "weekdayMorning": 0,
        "weekdayEvening": 4,
        "thursdayMorning": 0,
        "thursdayEvening": 1,
        "fridayMorning": 0,
        "fridayEvening": 1,
        "fullWeekday": 0,
        "fullThursday": 0,
        "fullFriday": 0
      },
      "calculationMonth": 1
    },
    "weeksPerMonthFirstHalf": 4.429,
    "weeksPerMonthSecondHalf": 4.286
  },
  "staffingRequirements": [],
  "holidays": [],
  "payrollClosures": [],
  "monthlyPlans": [],
  "floorMap": {
    "imageUrl": "",
    "imageOpacity": 0.18,
    "regions": [
      {
        "section": "سالن پایین",
        "x": 38,
        "y": 8,
        "w": 20,
        "h": 48
      },
      {
        "section": "سالن بالا",
        "x": 61,
        "y": 8,
        "w": 34,
        "h": 23
      },
      {
        "section": "بار",
        "x": 23,
        "y": 8,
        "w": 12,
        "h": 24
      },
      {
        "section": "صندوق",
        "x": 8,
        "y": 8,
        "w": 12,
        "h": 15
      },
      {
        "section": "هاست",
        "x": 8,
        "y": 26,
        "w": 12,
        "h": 14
      },
      {
        "section": "آشپزخانه",
        "x": 3,
        "y": 48,
        "w": 25,
        "h": 44
      },
      {
        "section": "خدمات",
        "x": 31,
        "y": 52,
        "w": 10,
        "h": 18
      },
      {
        "section": "قلیان‌خانه",
        "x": 31,
        "y": 73,
        "w": 13,
        "h": 19
      },
      {
        "section": "پیک",
        "x": 47,
        "y": 73,
        "w": 10,
        "h": 19
      },
      {
        "section": "پارکینگ",
        "x": 61,
        "y": 61,
        "w": 34,
        "h": 31
      }
    ]
  }
};
let state=null,currentView='dashboard',formHandler=null,shiftPickerContext=null,monthlyShiftPickerContext=null;
const ui={personnelSearch:'',salaryPersonnelSearch:'',salaryPersonnelPosition:'',salaryPersonnelStatus:'',shiftWeekStart:'',staffingFilter:{dayIndex:'',shift:'',section:'',position:''},staffingMap:{date:'',shift:'عصر'},monthlyPlan:{year:1405,month:1,selectedDate:''},annualCalendar:{year:1405},shiftReport:{personnelId:'',from:'',to:''},payroll:{year:1405,month:4,employmentStatus:'فعال'},payslip:{year:1405,month:4,personnelId:''},payments:{year:'',month:'',personnelId:'',type:'',method:'',from:'',to:''},reports:{year:1405,month:4},delayReport:{personnelId:'',from:'',to:''}};
const $=id=>document.getElementById(id);const qs=(s,r=document)=>r.querySelector(s);const qsa=(s,r=document)=>[...r.querySelectorAll(s)];
const normalizeNumberText=v=>String(v??'').replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[٬,\s]/g,'').replace(/٫/g,'.').replace(/[^0-9.\-]/g,'');const n=v=>{if(typeof v==='number')return Number.isFinite(v)?v:0;const x=Number(normalizeNumberText(v));return Number.isFinite(x)?x:0};const money=v=>new Intl.NumberFormat('fa-IR').format(Math.round(n(v)));const dec=(v,d=2)=>new Intl.NumberFormat('fa-IR',{maximumFractionDigits:d}).format(n(v));
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
const normalizeDigits=s=>String(s??'').replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d));
function parseJDate(s){const m=normalizeDigits(s).trim().match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);return m?{y:+m[1],m:+m[2],d:+m[3],code:+m[1]*10000+(+m[2])*100+(+m[3])}:null}
function periodOf(date){const p=parseJDate(date);return p?{year:p.y,month:p.m}:{year:0,month:0}}
function periodKey(y,m){return `${y}-${String(m).padStart(2,'0')}`}
function prevPeriod(y,m){return m===1?{year:y-1,month:12}:{year:y,month:m-1}}
function badge(text){const c=/(تسویه|تایید|فعال|انجام)/.test(text)?'success':/(ناقص|جزئی|پیش)/.test(text)?'warn':/(لغو|غیبت|ابطال|پرداخت‌نشده)/.test(text)?'danger':'';return `<span class="badge ${c}">${esc(text||'—')}</span>`}
function person(id){return (state?.personnel||[]).find(x=>x.id===id)||null}function personLabel(id){const p=person(id);return p?`${p.id} | ${p.name}`:'—'}
function uid(prefix,arr,width=5){let mx=0;(arr||[]).forEach(x=>{const m=String(x.id||'').match(/(\d+)$/);if(m)mx=Math.max(mx,+m[1])});return `${prefix}-${String(mx+1).padStart(width,'0')}`}
function jdiv(a,b){return ~~(a/b)}function jmod(a,b){return a-~~(a/b)*b}
function jalCal(jy,withoutLeap){const breaks=[-61,9,38,199,426,686,756,818,1111,1181,1210,1635,2060,2097,2192,2262,2324,2394,2456,3178];let bl=breaks.length,gy=jy+621,leapJ=-14,jp=breaks[0],jm,jump,leap,leapG,march,n,i;if(jy<jp||jy>=breaks[bl-1])throw Error('Invalid Jalaali year');for(i=1;i<bl;i++){jm=breaks[i];jump=jm-jp;if(jy<jm)break;leapJ+=jdiv(jump,33)*8+jdiv(jmod(jump,33),4);jp=jm}n=jy-jp;leapJ+=jdiv(n,33)*8+jdiv(jmod(n,33)+3,4);if(jmod(jump,33)===4&&jump-n===4)leapJ++;leapG=jdiv(gy,4)-jdiv((jdiv(gy,100)+1)*3,4)-150;march=20+leapJ-leapG;if(withoutLeap)return{gy,march};if(jump-n<6)n=n-jump+jdiv(jump+4,33)*33;leap=jmod(jmod(n+1,33)-1,4);if(leap===-1)leap=4;return{leap,gy,march}}
function g2d(gy,gm,gd){let d=jdiv((gy+jdiv(gm-8,6)+100100)*1461,4)+jdiv(153*jmod(gm+9,12)+2,5)+gd-34840408;d=d-jdiv(jdiv(gy+100100+jdiv(gm-8,6),100)*3,4)+752;return d}
function d2g(jdn){let j=4*jdn+139361631;j=j+jdiv(jdiv(4*jdn+183187720,146097)*3,4)*4-3908;let i=jmod(j,1461)/4*5+308;let gd=jdiv(jmod(i,153),5)+1;let gm=jmod(jdiv(i,153),12)+1;let gy=jdiv(j,1461)-100100+jdiv(8-gm,6);return{gy,gm,gd}}
function j2d(jy,jm,jd){const r=jalCal(jy,true);return g2d(r.gy,3,r.march)+(jm-1)*31-jdiv(jm,7)*(jm-7)+jd-1}
function d2j(jdn){const g=d2g(jdn),jy=g.gy-621,r=jalCal(jy,false),jdn1f=g2d(g.gy,3,r.march);let k=jdn-jdn1f,jm,jd,jy2=jy;if(k>=0){if(k<=185){jm=1+jdiv(k,31);jd=jmod(k,31)+1;return{jy:jy2,jm,jd}}k-=186}else{jy2--;k+=179;if(r.leap===1)k++}jm=7+jdiv(k,30);jd=jmod(k,30)+1;return{jy:jy2,jm,jd}}
function toJalaali(dt){return d2j(g2d(dt.getFullYear(),dt.getMonth()+1,dt.getDate()))}function toGregorian(jy,jm,jd){return d2g(j2d(jy,jm,jd))}
function todayJ(){const j=toJalaali(new Date());return `${j.jy}/${String(j.jm).padStart(2,'0')}/${String(j.jd).padStart(2,'0')}`}
function addJDays(s,days){const p=parseJDate(s);if(!p)return s;const g=toGregorian(p.y,p.m,p.d);const dt=new Date(g.gy,g.gm-1,g.gd);dt.setDate(dt.getDate()+days);const j=toJalaali(dt);return `${j.jy}/${String(j.jm).padStart(2,'0')}/${String(j.jd).padStart(2,'0')}`}
function monthName(m){return state.lists.months[m-1]||String(m)}


function jDayDiff(a,b){const pa=parseJDate(a),pb=parseJDate(b);return pa&&pb?j2d(pa.y,pa.m,pa.d)-j2d(pb.y,pb.m,pb.d):0}
function jMonthLength(y,m){if(m<=6)return 31;if(m<=11)return 30;return jalCal(y,false).leap===0?30:29}
function jDate(y,m,d){return `${y}/${String(m).padStart(2,'0')}/${String(d).padStart(2,'0')}`}
function dayIndexOfDate(date){const w=weekdayOf(date);return Math.max(0,state.lists.weekdays.indexOf(w))}
function getMonthlyPlan(year,month,create=true){year=Number(year);month=Number(month);let p=state.monthlyPlans.find(x=>Number(x.year)===year&&Number(x.month)===month);if(!p&&create){p={id:uid('MPL',state.monthlyPlans),year,month,notes:'',cells:{},createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),copiedFrom:''};state.monthlyPlans.push(p)}return p}
function monthlyCellKey(date,section,position,shift){return `${date}|${encodeURIComponent(section||'')}~${encodeURIComponent(position||'')}|${shift}`}
function parseMonthlyCellKey(key){const p=String(key).split('|');if(p.length!==3)return null;const [date,head,shift]=p,[s,pos]=head.split('~');return{date,section:decodeURIComponent(s||''),position:decodeURIComponent(pos||''),shift}}
function monthlyPlanCellIds(plan,date,section,position,shift){return plan?.cells?.[monthlyCellKey(date,section,position,shift)]||[]}
function monthlyPlanRows(plan,date){const rows=[],seen=new Set(),di=dayIndexOfDate(date);['صبح','عصر'].forEach(shift=>staffingReqsFor(date,di,shift).forEach(r=>{const k=`${r.section}~${r.position}`;if(!seen.has(k)){seen.add(k);rows.push({section:r.section,position:r.position})}}));Object.keys(plan?.cells||{}).forEach(k=>{const p=parseMonthlyCellKey(k);if(!p||p.date!==date)return;const x=`${p.section}~${p.position}`;if(!seen.has(x)){seen.add(x);rows.push({section:p.section,position:p.position})}});return rows.sort((a,b)=>a.section.localeCompare(b.section,'fa')||a.position.localeCompare(b.position,'fa'))}
function monthlyCoverageFor(plan,date,shift){const di=dayIndexOfDate(date),reqs=staffingReqsFor(date,di,shift),details=reqs.map(r=>{const assigned=monthlyPlanCellIds(plan,date,r.section,r.position,shift).length,required=n(r.requiredCount);return{...r,assigned,required,delta:assigned-required}}),shortage=details.reduce((s,x)=>s+Math.max(-x.delta,0),0),surplus=details.reduce((s,x)=>s+Math.max(x.delta,0),0);return{details,shortage,surplus,status:!details.length?'undefined':shortage>0?'shortage':surplus>0?'surplus':'complete'}}
function monthlyDayCoverage(plan,date){const a=monthlyCoverageFor(plan,date,'صبح'),b=monthlyCoverageFor(plan,date,'عصر'),shortage=a.shortage+b.shortage,surplus=a.surplus+b.surplus,status=shortage>0?'shortage':surplus>0?'surplus':(a.status==='undefined'&&b.status==='undefined'?'undefined':'complete');return{morning:a,evening:b,shortage,surplus,status}}
function monthlyPlanHasDate(plan,date){return Boolean(plan&&Object.keys(plan.cells||{}).some(k=>parseMonthlyCellKey(k)?.date===date))}
function planSourceForDate(date){const pr=periodOf(date),mp=getMonthlyPlan(pr.year,pr.month,false);if(monthlyPlanHasDate(mp,date))return'ماهانه';const wp=state.weeklyPlans.find(p=>dateCode(date)>=dateCode(p.weekStart)&&dateCode(date)<=dateCode(addJDays(p.weekStart,6)));return wp?'هفتگی':'بدون برنامه'}
function assignmentsForDate(date,section,position,shift){const pr=periodOf(date),mp=getMonthlyPlan(pr.year,pr.month,false);if(monthlyPlanHasDate(mp,date))return monthlyPlanCellIds(mp,date,section,position,shift);const wp=state.weeklyPlans.find(p=>dateCode(date)>=dateCode(p.weekStart)&&dateCode(date)<=dateCode(addJDays(p.weekStart,6)));if(!wp)return[];return planCellIds(wp,section,position,Math.max(0,jDayDiff(date,wp.weekStart)),shift)}
function payrollClosure(year,month){return [...(state.payrollClosures||[])].filter(c=>c.active!==false&&Number(c.year)===Number(year)&&Number(c.month)===Number(month)).sort((a,b)=>String(b.finalizedAt||'').localeCompare(String(a.finalizedAt||'')))[0]||null}
function isPeriodClosed(year,month){return Boolean(payrollClosure(year,month))}

function holidayInfo(date){
  const exact=(state.holidays||[]).find(h=>h.active!==false&&h.date===date);
  if(exact)return{type:'holiday-official',title:exact.title||'تعطیل رسمی',templateDayIndex:6};
  const tomorrow=addJDays(date,1),next=(state.holidays||[]).find(h=>h.active!==false&&h.date===tomorrow);
  if(next)return{type:'holiday-eve',title:`روز قبل ${next.title||'تعطیل رسمی'}`,templateDayIndex:5};
  return{type:'',title:'',templateDayIndex:null};
}
function effectiveRequirementDayIndex(date,actualDayIndex){const h=holidayInfo(date);return h.templateDayIndex==null?actualDayIndex:h.templateDayIndex}
function staffingReqsFor(date,actualDayIndex,shift){const di=effectiveRequirementDayIndex(date,actualDayIndex);return (state.staffingRequirements||[]).filter(r=>r.active!==false&&Number(r.dayIndex)===Number(di)&&r.shift===shift&&n(r.requiredCount)>0)}
function planCellKey(section,position,dayIndex,shift){return `${encodeURIComponent(section||'')}~${encodeURIComponent(position)}|${dayIndex}|${shift}`}
function parsePlanCellKey(key){const p=String(key).split('|');if(p.length!==3)return null;const [head,dayIndex,shift]=p;if(head.includes('~')){const [s,pos]=head.split('~');return{section:decodeURIComponent(s||''),position:decodeURIComponent(pos||''),dayIndex:Number(dayIndex),shift}}return{section:'',position:head,dayIndex:Number(dayIndex),shift}}
function planCellIds(plan,section,position,dayIndex,shift){const exact=plan.cells[planCellKey(section,position,dayIndex,shift)];if(Array.isArray(exact))return exact;const legacy=plan.cells[`${position}|${dayIndex}|${shift}`]||[];if(!section)return legacy;return legacy.filter(id=>(person(id)?.section||'')===section)}
function planRows(plan){
  const rows=[],seen=new Set();
  (state.staffingRequirements||[]).filter(r=>r.active!==false).forEach(r=>{const k=`${r.section}~${r.position}`;if(!seen.has(k)){seen.add(k);rows.push({section:r.section,position:r.position,configured:true})}});
  Object.keys(plan.cells||{}).forEach(k=>{const p=parsePlanCellKey(k);if(!p)return;const x=`${p.section}~${p.position}`;if(!seen.has(x)){seen.add(x);rows.push({section:p.section,position:p.position,configured:false})}});
  state.lists.positions.forEach(position=>{if(!rows.some(r=>r.position===position)){rows.push({section:'',position,configured:false})}});
  return rows.sort((a,b)=>(a.section||'zzz').localeCompare(b.section||'zzz','fa')||a.position.localeCompare(b.position,'fa'))
}
function requiredCountFor(date,actualDayIndex,shift,section,position){return staffingReqsFor(date,actualDayIndex,shift).filter(r=>r.section===section&&r.position===position).reduce((s,r)=>s+n(r.requiredCount),0)}
function coverageFor(plan,start,dayIndex,shift){
  const date=addJDays(start,dayIndex),reqs=staffingReqsFor(date,dayIndex,shift),details=reqs.map(r=>{const assigned=planCellIds(plan,r.section,r.position,dayIndex,shift).length,required=n(r.requiredCount);return{...r,assigned,required,delta:assigned-required}});
  const shortage=details.reduce((s,x)=>s+Math.max(-x.delta,0),0),surplus=details.reduce((s,x)=>s+Math.max(x.delta,0),0),required=details.reduce((s,x)=>s+x.required,0),assigned=details.reduce((s,x)=>s+x.assigned,0);
  return{date,details,shortage,surplus,required,assigned,status:!details.length?'undefined':shortage>0?'shortage':surplus>0?'surplus':'complete'}
}
function staffingCapacityRows(){
  const map=new Map();
  (state.staffingRequirements||[]).filter(r=>r.active!==false&&n(r.requiredCount)>0).forEach(r=>{const k=`${r.section}~${r.position}`,cur=map.get(k)||{section:r.section,position:r.position,peakRequired:0};cur.peakRequired=Math.max(cur.peakRequired,n(r.requiredCount));map.set(k,cur)});
  return [...map.values()].map(x=>{const main=activePersonnel().filter(p=>p.section===x.section&&p.mainPosition===x.position).length,backup=activePersonnel().filter(p=>p.section===x.section&&p.backupPosition===x.position).length;return{...x,main,backup,delta:main-x.peakRequired}}).sort((a,b)=>a.section.localeCompare(b.section,'fa')||a.position.localeCompare(b.position,'fa'))
}

let jsonFileHandle=null;
function apiErrorMessage(prefix,response,body=''){
  const suffix=[`HTTP ${response?.status||'?'}`,String(body||'').trim().slice(0,240)].filter(Boolean).join(' — ');
  return `${prefix}${suffix?`: ${suffix}`:''}`
}
function parseApiJsonText(text){
  let value=String(text??'').trim();
  if(!value)throw Error('پاسخ API خالی است');
  for(let i=0;i<3;i++){
    if(typeof value!=='string')break;
    const s=value.trim();
    if(!s)throw Error('پاسخ API خالی است');
    try{value=JSON.parse(s)}catch(e){
      if(i===0)throw Error(`پاسخ API، JSON معتبر نیست: ${s.slice(0,180)}`);
      break
    }
  }
  return value
}
function normalizeApiPayload(payload){
  let value=payload;
  for(let i=0;i<5;i++){
    if(typeof value==='string'){value=parseApiJsonText(value);continue}
    if(!value||typeof value!=='object'||Array.isArray(value))break;
    const keys=['data','result','value','payload','content'];
    const key=keys.find(k=>value[k]!=null);
    if(!key)break;
    value=value[key]
  }
  if(typeof value==='string')value=parseApiJsonText(value);
  if(window.RAYO_API_GATEWAY?.extractModule)value=window.RAYO_API_GATEWAY.extractModule(value,'hr');
  if(!value||typeof value!=='object'||Array.isArray(value))throw Error('ساختار اطلاعات دریافتی از API معتبر نیست');
  return value
}
async function fetchWithTimeout(url,options={}){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),APP_CONFIG.api.timeoutMs||30000);
  try{
    return await fetch(url,{...options,signal:controller.signal,mode:'cors',credentials:'omit'})
  }catch(e){
    if(e?.name==='AbortError')throw Error('زمان پاسخ‌گویی API تمام شد');
    if(String(e?.message||'').toLowerCase().includes('failed to fetch'))throw Error('ارتباط با API برقرار نشد؛ CORS، اینترنت یا آدرس API را بررسی کنید');
    throw e
  }finally{clearTimeout(timer)}
}
async function apiLoadData(){
  if(!window.RAYO_API_GATEWAY?.loadOrBootstrap)throw Error('RAYO_API_GATEWAY آماده نیست');
  return window.RAYO_API_GATEWAY.loadOrBootstrap('hr');
}

const StorageAdapter={
  lastSource:'',
  async load(){
    if(APP_CONFIG.storageMode!=='api')throw Error('حالت ذخیره محلی غیرفعال است');
    const data=await apiLoadData();
    this.lastSource='api';
    return data;
  },
  async save(data){
    if(APP_CONFIG.storageMode!=='api')throw Error('حالت ذخیره محلی غیرفعال است');
    const saveToken=`SAVE-${Date.now()}-${Math.random().toString(36).slice(2,9)}`;
    data.meta=data.meta||{};
    data.meta.serverSaveToken=saveToken;
    data.meta.updatedAt=new Date().toISOString();
    data.meta.revision=(Number(data.meta.revision)||0)+1;
    await window.RAYO_API_GATEWAY.saveModule('hr',data,{verify:APP_CONFIG.api.verifyAfterSave!==false});
    this.lastSource='api';
    return{ok:true};
  }
};

function migrate(d){
  d=d||{};const x={...structuredClone(DEFAULT_DATA),...d};delete x.jobGrades;delete x.skills;
  for(const k of ['personnel','weeklyPlans','monthlyPlans','shiftRecords','monthlyAdjustments','tipGroups','penaltiesRewards','delays','payments','consumptions','leaves','changeLog','staffingRequirements','holidays','payrollClosures'])if(!Array.isArray(x[k]))x[k]=[];
  x.settings={...DEFAULT_DATA.settings,...(d.settings||{})};x.lists={...DEFAULT_DATA.lists,...(d.lists||{})};['سالن بالا','سالن پایین','حیاط','تراس'].forEach(s=>{if(!x.lists.sections.includes(s))x.lists.sections.push(s)});x.meta={...DEFAULT_DATA.meta,...(d.meta||{})};x.meta.schemaVersion='2.3.0';
  x.staffingRequirements=x.staffingRequirements.map(r=>({...r,dayIndex:Number(r.dayIndex),requiredCount:Math.max(0,Number(r.requiredCount)||0),active:r.active!==false}));x.holidays=x.holidays.map(h=>({...h,active:h.active!==false}));
  x.monthlyPlans=x.monthlyPlans.map(p=>({...p,year:Number(p.year),month:Number(p.month),cells:p.cells||{},notes:p.notes||''}));
  x.payrollClosures=x.payrollClosures.map(c=>({...c,year:Number(c.year),month:Number(c.month),active:c.active!==false,rows:Array.isArray(c.rows)?c.rows:[],payments:Array.isArray(c.payments)?c.payments:[]}));
  x.floorMap={...structuredClone(DEFAULT_DATA.floorMap),...(d.floorMap||{}),regions:Array.isArray(d.floorMap?.regions)&&d.floorMap.regions.length?d.floorMap.regions:structuredClone(DEFAULT_DATA.floorMap.regions)};
  const sm=d.salaryModel||{};x.salaryModel={...structuredClone(DEFAULT_DATA.salaryModel),...sm,workHours:{...DEFAULT_DATA.salaryModel.workHours,...(sm.workHours||{})},positionCoefficients:{...DEFAULT_DATA.salaryModel.positionCoefficients,...(sm.positionCoefficients||{})},gradeCoefficients:{...DEFAULT_DATA.salaryModel.gradeCoefficients,...(sm.gradeCoefficients||{})},draft:{...DEFAULT_DATA.salaryModel.draft,...(sm.draft||{}),schedule:{...DEFAULT_DATA.salaryModel.draft.schedule,...(sm.draft?.schedule||{})},reverseSchedule:{...DEFAULT_DATA.salaryModel.draft.reverseSchedule,...(sm.draft?.reverseSchedule||{})}}};
  x.lists.positions.forEach(p=>{if(x.salaryModel.positionCoefficients[p]==null)x.salaryModel.positionCoefficients[p]=1});
  x.personnel=x.personnel.map(p=>{const {skillFactor,seniorityFactor,...clean}=p;return({...clean,gradeId:p.gradeId||'D',experienceMonths:n(p.experienceMonths),salaryProfile:{position:p.mainPosition||'',grade:p.gradeId||'D',experienceMonths:n(p.experienceMonths),schedule:{weekdayMorning:0,weekdayEvening:0,thursdayMorning:0,thursdayEvening:0,fridayMorning:0,fridayEvening:0,fullWeekday:0,fullThursday:0,fullFriday:0},returnAid:0,incentive:0,contractMonthly:0,updatedAt:null,...(p.salaryProfile||{}),schedule:{weekdayMorning:0,weekdayEvening:0,thursdayMorning:0,thursdayEvening:0,fridayMorning:0,fridayEvening:0,fullWeekday:0,fullThursday:0,fullFriday:0,...(p.salaryProfile?.schedule||{})}}})});
  return x
}
function tipsOnlyPage(){const f=(location.pathname.split('/').pop()||'index.html').toLowerCase(),v=new URLSearchParams(location.search).get('view');return f==='personnel.html'&&v==='tips'}
function hrDataRequiredForPage(){const f=(location.pathname.split('/').pop()||'index.html').toLowerCase();return !tipsOnlyPage()&&(f===''||f==='index.html'||f==='personnel.html'||f==='reports.html')}
async function init(){showLoading(true);try{if(hrDataRequiredForPage()){const live=await StorageAdapter.load(),st=window.RAYO_API_GATEWAY?.getModuleStatus?.('hr')||{};state=migrate(live);window.__RAYO_HR_SERVER_CONFIRMED__=st.initialized===true;$('saveStatus').textContent=st.initialized===true?'اطلاعات زنده از RayoData دریافت شد':'ماژول پرسنل هنوز مقداردهی اولیه نشده است — ذخیره عادی مسدود است'}else{state=migrate(structuredClone(DEFAULT_DATA));window.__RAYO_HR_SERVER_CONFIRMED__=false;$('saveStatus').textContent=tipsOnlyPage()?'بخش انعام از Query دریافت می‌شود':''}const t=parseJDate(todayJ());ui.payroll.year=ui.payslip.year=ui.reports.year=ui.monthlyPlan.year=ui.annualCalendar.year=t.y;ui.payroll.month=ui.payslip.month=ui.reports.month=ui.monthlyPlan.month=t.m;ui.shiftWeekStart=todayJ();ui.monthlyPlan.selectedDate=todayJ();ui.staffingMap.date=todayJ();ui.payments.year=t.y;ui.payments.month=t.m;render();if(tipsOnlyPage()){const saveButton=$('serverSaveButton');if(saveButton)saveButton.style.display='none';document.addEventListener('click',e=>{const b=e.target.closest?.('.nav-btn[data-view]');if(!b||b.dataset.view==='tips')return;e.preventDefault();e.stopImmediatePropagation();location.href='personnel.html?view='+encodeURIComponent(b.dataset.view)},true)}}catch(e){window.__RAYO_HR_SERVER_CONFIRMED__=false;toast(e.message,true);state=migrate(structuredClone(DEFAULT_DATA));render();$('saveStatus').textContent='خطا در دریافت اطلاعات سرور — ذخیره برای حفاظت از داده‌ها غیرفعال است'}finally{showLoading(false)}}
const __toastRecent=new Map();
function showLoading(v){$('loading').classList.toggle('show',v)}function toast(msg,error=false){msg=String(msg??'');const key=(error?'E:':'I:')+msg,now=Date.now(),last=__toastRecent.get(key)||0;if(now-last<5000)return;__toastRecent.set(key,now);const d=document.createElement('div');d.className='toast'+(error?' error':'');d.textContent=msg;$('toasts').appendChild(d);setTimeout(()=>d.remove(),error?7000:3500)}
async function saveData(manual=false){
  const button=$('serverSaveButton');
  try{
    if(hrDataRequiredForPage()&&window.__RAYO_HR_SERVER_CONFIRMED__!==true)throw new Error('ذخیره مسدود شد: نسخه زنده پرسنل از سرور تأیید نشده است. ابتدا «بروزرسانی از سرور» را انجام دهید.');
    if(button){button.disabled=true;button.textContent='در حال ذخیره روی سرور…'}
    $('saveStatus').textContent='در حال ذخیره روی سرور…';
    state.meta=state.meta||{};state.meta.updatedAt=new Date().toISOString();
    await StorageAdapter.save(state);
    $('saveStatus').textContent=`ذخیره روی سرور انجام شد: ${new Date().toLocaleString('fa-IR')}`;
    if(manual)toast('اطلاعات روی سرور ذخیره شد');
    return true
  }catch(e){
    $('saveStatus').textContent='ذخیره روی سرور ناموفق بود';
    toast(e.message||'ذخیره روی سرور انجام نشد',true);
    return false
  }finally{if(button){button.disabled=false;button.textContent='ذخیره روی سرور'}}
}
async function commit(reason){
  state.changeLog.unshift({id:uid('LOG',state.changeLog),at:new Date().toISOString(),action:reason});state.changeLog=state.changeLog.slice(0,500);
  const ok=await saveData(false);
  if(ok){renderView();toast(reason+' با موفقیت ذخیره شد')}
  return ok
}
async function refreshData(){showLoading(true);try{const live=await apiLoadData(),st=window.RAYO_API_GATEWAY?.getModuleStatus?.('hr')||{};state=migrate(live);window.__RAYO_HR_SERVER_CONFIRMED__=st.initialized===true;localStorage.setItem(APP_CONFIG.storageKey,JSON.stringify(state));StorageAdapter.lastSource='api';render();$('saveStatus').textContent=st.initialized===true?`آخرین دریافت از سرور: ${new Date().toLocaleString('fa-IR')}`:'ماژول پرسنل هنوز مقداردهی اولیه نشده است — ذخیره عادی مسدود است';toast(st.initialized===true?'اطلاعات زنده از سرور بروزرسانی شد':'ماژول پرسنل هنوز مقداردهی اولیه نشده است')}catch(e){toast(e.message,true)}finally{showLoading(false)}}
function exportJson(){const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json;charset=utf-8'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`rayo-hr-${todayJ().replaceAll('/','-')}.json`;a.click();URL.revokeObjectURL(a.href)}
function downloadCsv(filename,rows){const text='\uFEFF'+rows.map(r=>r.map(v=>'"'+String(v??'').replaceAll('"','""')+'"').join(',')).join('\n');const blob=new Blob([text],{type:'text/csv;charset=utf-8'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=filename;a.click();URL.revokeObjectURL(a.href)}
async function saveJsonToDisk(){
  try{
    state.meta.updatedAt=new Date().toISOString();
    if('showSaveFilePicker' in window){
      if(!jsonFileHandle)jsonFileHandle=await window.showSaveFilePicker({suggestedName:'personnel-export.json',types:[{description:'JSON',accept:{'application/json':['.json']}}]});
      const w=await jsonFileHandle.createWritable();await w.write(JSON.stringify(state,null,2));await w.close();
      await StorageAdapter.save(state);$('saveStatus').textContent=`آخرین ذخیره فایل: ${new Date().toLocaleString('fa-IR')}`;toast('همان JSON مشترک ذخیره شد');
    }else{exportJson();toast('مرورگر نوشتن مستقیم فایل را پشتیبانی نمی‌کند؛ JSON دانلود شد')}
  }catch(e){if(e?.name!=='AbortError')toast('ذخیره فایل JSON انجام نشد',true)}
}
function importJson(e){const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=async()=>{try{state=migrate(JSON.parse(r.result));await commit('ورود اطلاعات از فایل JSON');toast('فایل JSON وارد شد')}catch(err){toast('فایل JSON معتبر نیست',true)}};r.readAsText(f);e.target.value=''}
function goView(view){currentView=view;qsa('.nav-btn').forEach(x=>x.classList.toggle('active',x.dataset.view===view));renderView()}function render(){qsa('.nav-btn').forEach(b=>{b.onclick=()=>goView(b.dataset.view)});renderView()}
const titles={dashboard:'داشبورد',personnel:'لیست پرسنل',staffingNeeds:'نیروی موردنیاز',staffingMap:'نقشه کمبود نیرو',annualCalendar:'تقویم سالانه',monthlyShiftPlan:'برنامه ماهانه شیفت',shiftPlan:'برنامه هفتگی شیفت',shiftHistory:'سوابق تاریخ‌دار شیفت',shiftReport:'گزارش شیفت',payroll:'کارکرد و حقوق ماه',salaryCalculator:'محاسبه‌گر حقوق',salaryPersonnel:'پرسنل محاسبه‌گر',salaryRates:'جدول حقوق ساعتی',salarySettings:'تنظیمات پایه مدل حقوق',payslip:'فیش حقوقی',tips:'انعام و تقسیم سهم',penalties:'جریمه و تشویق',delays:'ثبت و گزارش تأخیر',payments:'پرداخت حقوق و مساعده',consumption:'مصرف پرسنلی',leaves:'مرخصی و غیبت',reports:'گزارشات مدیریتی',settings:'تنظیمات و فهرست‌ها',changelog:'تاریخچه تغییرات'};
function pageHead(title,desc,actions=''){return `<div class="page-title"><div><h1>${title}</h1><p>${desc}</p></div><div class="top-actions">${actions}</div></div>`}
function renderView(){if(!state){if($('topTitle'))$('topTitle').textContent=titles[currentView]||'در حال بارگذاری';if($('view'))$('view').innerHTML='<div class="card"><div class="empty">در حال بارگذاری اطلاعات…</div></div>';return}if(!Array.isArray(state.personnel))state.personnel=[];if(!Array.isArray(state.payrollClosures))state.payrollClosures=[];$('topTitle').textContent=titles[currentView]||'';const fn=views[currentView]||views.dashboard;$('view').innerHTML=fn();setTimeout(afterRender,0)}
function afterRender(){if(currentView==='reports')drawReportsCharts();if(currentView==='dashboard')drawDashboardChart();if(currentView==='salaryCalculator')salaryCalcAfterRender()}
function activePersonnel(){return (state?.personnel||[]).filter(p=>p.status==='فعال')}
function optionList(arr,val){return arr.map(x=>`<option ${String(x)===String(val)?'selected':''}>${esc(x)}</option>`).join('')}
function personOptions(val,allowAll=false){return `${allowAll?'<option value="">همه پرسنل</option>':'<option value="">انتخاب کنید</option>'}`+activePersonnel().map(p=>`<option value="${p.id}" ${p.id===val?'selected':''}>${esc(p.id+' | '+p.name)}</option>`).join('')}
function allPersonOptions(val,allowAll=false){return `${allowAll?'<option value="">همه پرسنل</option>':'<option value="">انتخاب کنید</option>'}`+state.personnel.map(p=>`<option value="${p.id}" ${p.id===val?'selected':''}>${esc(p.id+' | '+p.name)}</option>`).join('')}
function viewsDashboard(){const t=parseJDate(todayJ()),rows=state.personnel.filter(p=>p.status==='فعال').map(p=>calcPayroll(p,t.y,t.m));const tips=state.tipGroups.filter(x=>{const q=periodOf(x.receiveDate);return q.year===t.y&&q.month===t.m&&x.status!=='ابطال‌شده'});const totalNet=rows.reduce((s,x)=>s+x.netToman,0),out=rows.reduce((s,x)=>s+x.unpaid,0),tipTotal=tips.reduce((s,x)=>s+n(x.totalAmount),0);return pageHead('داشبورد مدیریتی',`وضعیت ${monthName(t.m)} ${t.y}`)+`<div class="grid grid-4"><div class="card kpi"><div class="label">پرسنل فعال</div><div class="value">${activePersonnel().length}</div><div class="sub">نفر</div></div><div class="card kpi"><div class="label">حقوق خالص پیش‌بینی</div><div class="value">${money(totalNet)}</div><div class="sub">تومان</div></div><div class="card kpi"><div class="label">مانده قابل پرداخت</div><div class="value">${money(out)}</div><div class="sub">تومان</div></div><div class="card kpi"><div class="label">انعام دریافت‌شده</div><div class="value">${money(tipTotal)}</div><div class="sub">تومان</div></div></div><div class="grid grid-2"><div class="card"><div class="section-head"><h2>روند ۱۲ ماهه</h2></div><canvas class="chart" id="dashboardChart"></canvas></div><div class="card"><div class="section-head"><h2>آخرین تغییرات</h2></div>${state.changeLog.length?`<table class="mini-table">${state.changeLog.slice(0,8).map(x=>`<tr><td>${esc(new Date(x.at).toLocaleString('fa-IR'))}</td><td>${esc(x.action)}</td></tr>`).join('')}</table>`:'<div class="empty">هنوز تغییری ثبت نشده است.</div>'}</div></div>`}
function openForm(title,fields,initial,onSave){formHandler=()=>{const o={};fields.forEach(f=>{const e=$('f_'+f.name);if(f.type==='checkbox')o[f.name]=e.checked;else if(f.type==='number')o[f.name]=e.value===''?'':Number(normalizeDigits(e.value));else o[f.name]=e.value});onSave(o)};$('modalTitle').textContent=title;$('modalBody').innerHTML=`<div class="form-grid">${fields.map(f=>{let c='';const v=initial?.[f.name]??'';if(f.type==='select')c=`<select id="f_${f.name}"><option value="">انتخاب کنید</option>${(f.options||[]).map(x=>{const a=typeof x==='object'?x:{value:x,label:x};return `<option value="${esc(a.value)}" ${String(a.value)===String(v)?'selected':''}>${esc(a.label)}</option>`}).join('')}</select>`;else if(f.type==='textarea')c=`<textarea id="f_${f.name}" placeholder="${esc(f.placeholder||'')}">${esc(v)}</textarea>`;else if(f.type==='checkbox')c=`<input id="f_${f.name}" type="checkbox" ${v?'checked':''}>`;else c=`<input id="f_${f.name}" type="${f.type||'text'}" value="${esc(v)}" placeholder="${esc(f.placeholder||'')}">`;return `<div class="field ${f.full?'full':''}"><label>${esc(f.label)}</label>${c}${f.help?`<small class="muted">${esc(f.help)}</small>`:''}</div>`}).join('')}</div>`;$('modalFoot').innerHTML=`<button class="btn" onclick="closeModal()">انصراف</button><button class="btn btn-primary" onclick="submitModal()">ذخیره</button>`;$('modalBackdrop').classList.add('open')}
function submitModal(){try{formHandler&&formHandler()}catch(e){toast(e.message,true)}}function closeModal(){$('modalBackdrop').classList.remove('open');formHandler=null}
function viewsPersonnel(){
  const q=ui.personnelSearch.toLowerCase(),items=state.personnel.filter(p=>(p.name+p.id+p.mainPosition+(p.section||'')).toLowerCase().includes(q)),cap=staffingCapacityRows();
  const shortage=cap.reduce((s,x)=>s+Math.max(-x.delta,0),0),surplus=cap.reduce((s,x)=>s+Math.max(x.delta,0),0),covered=cap.filter(x=>x.delta===0).length;
  const capacityBlock=cap.length?`<div class="staffing-summary"><div class="card kpi"><div class="label">کمبود نیروی ثابت</div><div class="value danger-text">${shortage}</div><div class="sub">نفر نسبت به حداکثر نیاز یک شیفت</div></div><div class="card kpi"><div class="label">مازاد نیروی ثابت</div><div class="value positive">${surplus}</div><div class="sub">نفر در ترکیب سکشن و پوزیشن</div></div><div class="card kpi"><div class="label">ترکیب‌های کامل</div><div class="value">${covered}</div><div class="sub">از ${cap.length} ترکیب تعریف‌شده</div></div><div class="card kpi"><div class="label">نیروی فعال</div><div class="value">${activePersonnel().length}</div><div class="sub">نفر</div></div></div><div class="card"><div class="section-head"><h2>تحلیل ظرفیت پرسنل ثابت</h2><button class="btn" onclick="goView('staffingNeeds')">ویرایش نیروی موردنیاز</button> <button class="btn" onclick="goView('staffingMap')">نقشه کمبود</button></div><div class="hint">مقایسه بر اساس بیشترین نیاز تعریف‌شده برای هر «سکشن + پوزیشن» و فقط پوزیشن اصلی نیروهای فعال است. نیروهای بک‌آپ جداگانه نمایش داده می‌شوند.</div><div class="table-wrap"><table class="data-table capacity-table"><thead><tr><th>سکشن</th><th>پوزیشن</th><th>حداکثر نیاز یک شیفت</th><th>نیروی اصلی فعال</th><th>بک‌آپ مرتبط</th><th>وضعیت</th></tr></thead><tbody>${cap.map(x=>`<tr><td>${esc(x.section)}</td><td>${esc(x.position)}</td><td>${x.peakRequired}</td><td>${x.main}</td><td>${x.backup}</td><td>${x.delta<0?`<span class="capacity-delta shortage">کمبود ${Math.abs(x.delta)} نفر</span>`:x.delta>0?`<span class="capacity-delta surplus">مازاد ${x.delta} نفر</span>`:'<span class="capacity-delta ok">کامل</span>'}</td></tr>`).join('')}</tbody></table></div></div>`:`<div class="card"><div class="hint">هنوز نیروی موردنیاز تعریف نشده است. برای فعال‌شدن تحلیل کمبود و مازاد، ابتدا الگوی روز و شیفت را ثبت کنید.</div><button class="btn btn-primary" onclick="goView('staffingNeeds')">تعریف نیروی موردنیاز</button></div>`;
  return pageHead('لیست پرسنل','اطلاعات پایه، پوزیشن اصلی و بک‌آپ، بیمه و نرخ ساعتی',`<button class="btn btn-primary" onclick="editPersonnel()">+ افزودن پرسنل</button>`)+capacityBlock+`<div class="card"><div class="toolbar"><div class="field"><label>جست‌وجو</label><input value="${esc(ui.personnelSearch)}" data-live-filter="ui.personnelSearch" oninput="rayoLiveFilter(this,ui,'personnelSearch')" placeholder="نام، کد، سکشن یا پوزیشن"></div></div></div><div class="card"><div class="table-wrap"><table class="data-table"><thead><tr><th>کد</th><th>نام</th><th>سکشن</th><th>پوزیشن اصلی</th><th>بک‌آپ</th><th>ملیت</th><th>بیمه</th><th>شروع کار</th><th>نوع همکاری</th><th>گرید</th><th>سابقه</th><th>نرخ ساعتی</th><th>وضعیت</th><th></th></tr></thead><tbody>${items.map(p=>`<tr><td class="nowrap">${p.id}</td><td><b>${esc(p.name)}</b></td><td>${esc(p.section||'—')}</td><td>${esc(p.mainPosition)}</td><td>${esc(p.backupPosition||'—')}</td><td>${esc(p.nationality||'—')}</td><td>${badge(p.insurance||'نامشخص')}</td><td>${esc(p.startDate||'—')}</td><td>${esc(p.employmentType||'—')}</td><td>${esc(p.gradeId||'D')}</td><td>${dec(p.experienceMonths||0,0)} ماه</td><td class="num">${money(p.hourlyRate)}</td><td>${badge(p.status)}</td><td class="actions"><button class="btn btn-sm" onclick="editPersonnel('${p.id}')">ویرایش</button> <button class="btn btn-danger btn-sm" onclick="removeItem('personnel','${p.id}','حذف پرسنل')">حذف</button></td></tr>`).join('')||'<tr><td colspan="14" class="empty">رکوردی نیست.</td></tr>'}</tbody></table></div></div>`
}
function editPersonnel(id){const p=id?person(id):{status:'فعال',transportMonthly:0,fixedAllowance:0,hourlyRate:0,monthlyCredit:0,mealCredit:0};openForm(id?'ویرایش پرسنل':'افزودن پرسنل',[{name:'name',label:'نام و نام خانوادگی'},{name:'mainPosition',label:'پوزیشن اصلی',type:'select',options:state.lists.positions},{name:'backupPosition',label:'پوزیشن بک‌آپ',type:'select',options:state.lists.positions},{name:'nationality',label:'ملیت',type:'select',options:state.lists.nationalities},{name:'insurance',label:'وضعیت بیمه',type:'select',options:state.lists.insuranceStatuses},{name:'startDate',label:'تاریخ شروع',placeholder:'1405/04/01'},{name:'phone',label:'شماره تماس'},{name:'employmentType',label:'نوع همکاری',type:'select',options:state.lists.employmentTypes},{name:'status',label:'وضعیت همکاری',type:'select',options:state.lists.employmentStatuses},{name:'section',label:'سکشن محاسبه',type:'select',options:state.lists.sections},{name:'gradeId',label:'گرید مدل حقوق',type:'select',options:['A','B','C','D']},{name:'experienceMonths',label:'سابقه قابل محاسبه (ماه)',type:'number'},{name:'hourlyRate',label:'دستمزد ساعتی (تومان)',type:'number'},{name:'transportMonthly',label:'رفت‌وآمد ماهانه',type:'number'},{name:'fixedAllowance',label:'فوق‌العاده ثابت',type:'number'},{name:'monthlyCredit',label:'سقف اعتبار ماهانه',type:'number'},{name:'mealCredit',label:'سقف غذای پرسنلی',type:'number'},{name:'tipGroup',label:'گروه انعام',type:'select',options:state.lists.hallGroups},{name:'notes',label:'توضیحات',type:'textarea',full:true}],p,async o=>{if(!o.name)throw Error('نام الزامی است');if(id)Object.assign(p,o);else state.personnel.push({id:uid('EMP',state.personnel,4),...o});closeModal();await commit(id?'ویرایش پرسنل':'افزودن پرسنل')})}
function removeItem(collection,id,reason){if(!confirm('این رکورد حذف شود؟'))return;state[collection]=state[collection].filter(x=>x.id!==id);commit(reason)}



function mapSectionStatus(date,shift,section){const di=dayIndexOfDate(date),reqs=staffingReqsFor(date,di,shift).filter(r=>r.section===section),details=reqs.map(r=>{const assigned=assignmentsForDate(date,r.section,r.position,shift).length,required=n(r.requiredCount);return{position:r.position,assigned,required,delta:assigned-required}}),shortage=details.reduce((s,x)=>s+Math.max(-x.delta,0),0),surplus=details.reduce((s,x)=>s+Math.max(x.delta,0),0),status=!details.length?'undefined':shortage>0?'shortage':surplus>0?'surplus':'complete';return{section,details,shortage,surplus,status}}
function viewsStaffingMap(){const f=ui.staffingMap;if(!parseJDate(f.date))f.date=todayJ();const configured=(state.floorMap?.regions||[]),mapped=new Set(configured.map(r=>r.section)),statuses=configured.map(r=>({...r,...mapSectionStatus(f.date,f.shift,r.section)})),allSections=[...new Set(staffingReqsFor(f.date,dayIndexOfDate(f.date),f.shift).map(r=>r.section))],unmapped=allSections.filter(s=>!mapped.has(s)).map(s=>mapSectionStatus(f.date,f.shift,s)),totalShort=statuses.concat(unmapped).reduce((s,x)=>s+x.shortage,0),totalSurplus=statuses.concat(unmapped).reduce((s,x)=>s+x.surplus,0),image=state.floorMap?.imageUrl||'';const regions=statuses.map(x=>`<div class="floor-region ${x.status}" style="left:${n(x.x)}%;top:${n(x.y)}%;width:${n(x.w)}%;height:${n(x.h)}%"><h4>${esc(x.section)}</h4>${x.details.length?x.details.map(d=>`<div class="map-line">${esc(d.position)}: <b>${d.assigned}/${d.required}</b>${d.delta<0?` — کمبود ${Math.abs(d.delta)}`:d.delta>0?` — مازاد ${d.delta}`:' — کامل'}</div>`).join(''):'<div class="map-line muted">نیازی تعریف نشده</div>'}</div>`).join('');const list=statuses.concat(unmapped).filter(x=>x.details.length).map(x=>`<div class="map-summary-item ${x.status}"><b>${esc(x.section)}</b><br>${x.details.map(d=>`${esc(d.position)} ${d.assigned}/${d.required}`).join(' • ')}</div>`).join('');return pageHead('نقشه ویژوال کمبود نیرو','کمبود و مازاد هر پوزیشن روی محدوده سکشن نمایش داده می‌شود. تصویر نقشه بعداً از تنظیمات قابل جایگزینی است.',`<button class="btn" onclick="goView('staffingNeeds')">تنظیم نیاز نیرو</button>`)+`<div class="card"><div class="toolbar"><div class="field"><label>تاریخ</label><input value="${esc(f.date)}" onchange="ui.staffingMap.date=this.value;renderView()"></div><div class="field"><label>شیفت</label><select onchange="ui.staffingMap.shift=this.value;renderView()">${['صبح','عصر'].map(x=>`<option ${f.shift===x?'selected':''}>${x}</option>`).join('')}</select></div><div class="kpi"><div class="label">کمبود کل</div><div class="value danger-text">${totalShort}</div></div><div class="kpi"><div class="label">مازاد کل</div><div class="value positive">${totalSurplus}</div></div></div><div class="holiday-legend">${holidayInfo(f.date).title?`<span class="${holidayInfo(f.date).type==='holiday-official'?'official':'eve'}">${esc(holidayInfo(f.date).title)}</span>`:''}<span>منبع چیدمان: ${planSourceForDate(f.date)}</span></div></div><div class="floor-map-shell"><div class="card floor-map-scroll"><div class="floor-map-canvas" style="${image?`background-image:url('${esc(image)}');background-color:rgba(248,250,252,${1-n(state.floorMap.imageOpacity??.18)})`:''}">${regions}</div></div><div class="card"><h2>جزئیات سکشن‌ها</h2><div class="map-summary-list">${list||'<div class="empty">برای این تاریخ و شیفت نیازی تعریف نشده است.</div>'}</div></div></div>`}

function viewsAnnualCalendar(){const year=Number(ui.annualCalendar.year)||parseJDate(todayJ()).y;const months=state.lists.months.map((name,mi)=>{const m=mi+1,len=jMonthLength(year,m),offset=dayIndexOfDate(jDate(year,m,1)),cells=Array(offset).fill('<div></div>');for(let d=1;d<=len;d++){const date=jDate(year,m,d),hi=holidayInfo(date),fri=weekdayOf(date)==='جمعه',exact=(state.holidays||[]).find(h=>h.active!==false&&h.date===date);cells.push(`<button class="annual-day ${hi.type==='holiday-official'?'official':hi.type==='holiday-eve'?'eve':''} ${fri?'friday':''}" onclick="editHoliday('${exact?.id||''}','${date}')"><b>${d}</b><br><small>${esc(weekdayOf(date).slice(0,2))}</small>${hi.title?`<span class="dot" title="${esc(hi.title)}"></span>`:''}</button>`)}return `<div class="annual-month"><h3>${esc(name)} ${year}</h3><div class="annual-grid">${state.lists.weekdays.map(x=>`<div class="dow">${esc(x.slice(0,2))}</div>`).join('')}${cells.join('')}</div></div>`}).join('');const count=(state.holidays||[]).filter(h=>h.active!==false&&parseJDate(h.date)?.y===year).length;return pageHead('تقویم سالانه تعطیلات','نمای کامل سال برای برنامه‌ریزی ماهانه شیفت؛ روی هر روز کلیک کنید تا تعطیلی ثبت یا ویرایش شود.',`<button class="btn btn-primary" onclick="editHoliday('','${year}/01/01')">+ ثبت تعطیلی</button>`)+`<div class="card"><div class="toolbar"><div class="field"><label>سال شمسی</label><input type="number" value="${year}" onchange="ui.annualCalendar.year=+this.value;renderView()"></div><div class="kpi"><div class="label">تعطیلات ثبت‌شده این سال</div><div class="value">${count}</div></div><button class="btn" onclick="goView('monthlyShiftPlan')">برنامه‌ریزی ماهانه</button></div><div class="holiday-legend"><span class="official">تعطیل رسمی؛ الگوی جمعه</span><span class="eve">روز قبل تعطیل؛ الگوی پنجشنبه</span></div></div><div class="annual-calendar">${months}</div>`}

function viewsStaffingNeeds(){
  const f=ui.staffingFilter,rows=(state.staffingRequirements||[]).filter(r=>(f.dayIndex===''||Number(r.dayIndex)===Number(f.dayIndex))&&(!f.shift||r.shift===f.shift)&&(!f.section||r.section===f.section)&&(!f.position||r.position===f.position)).sort((a,b)=>Number(a.dayIndex)-Number(b.dayIndex)||a.shift.localeCompare(b.shift,'fa')||a.section.localeCompare(b.section,'fa')||a.position.localeCompare(b.position,'fa'));
  const peakMorning=Math.max(0,...state.lists.weekdays.map((_,di)=>(state.staffingRequirements||[]).filter(r=>r.active!==false&&Number(r.dayIndex)===di&&r.shift==='صبح').reduce((s,r)=>s+n(r.requiredCount),0))),peakEvening=Math.max(0,...state.lists.weekdays.map((_,di)=>(state.staffingRequirements||[]).filter(r=>r.active!==false&&Number(r.dayIndex)===di&&r.shift==='عصر').reduce((s,r)=>s+n(r.requiredCount),0)));
  return pageHead('نیروی موردنیاز','تعداد موردنیاز را برای هر روز هفته، شیفت، سکشن و پوزیشن تعریف کنید.',`<button class="btn" onclick="goView('staffingMap')">نقشه کمبود</button> <button class="btn btn-primary" onclick="editStaffingRequirement()">+ تعریف نیاز</button>`)+`<div class="staffing-summary"><div class="card kpi"><div class="label">قواعد فعال</div><div class="value">${(state.staffingRequirements||[]).filter(x=>x.active!==false).length}</div></div><div class="card kpi"><div class="label">بیشترین نیاز صبح</div><div class="value">${peakMorning}</div><div class="sub">نفر در یک روز</div></div><div class="card kpi"><div class="label">بیشترین نیاز عصر</div><div class="value">${peakEvening}</div><div class="sub">نفر در یک روز</div></div><div class="card kpi"><div class="label">روزهای دارای الگو</div><div class="value">${new Set((state.staffingRequirements||[]).filter(x=>x.active!==false).map(x=>x.dayIndex)).size}</div><div class="sub">از ۷ روز</div></div></div><div class="card"><div class="hint">در تعطیل رسمی، سیستم خودکار از ظرفیت تعریف‌شده برای جمعه استفاده می‌کند و در روز قبل تعطیل از ظرفیت پنجشنبه.</div><div class="requirements-filter"><div class="field"><label>روز</label><select onchange="ui.staffingFilter.dayIndex=this.value;renderView()"><option value="">همه روزها</option>${state.lists.weekdays.map((x,i)=>`<option value="${i}" ${String(f.dayIndex)===String(i)?'selected':''}>${esc(x)}</option>`).join('')}</select></div><div class="field"><label>شیفت</label><select onchange="ui.staffingFilter.shift=this.value;renderView()"><option value="">همه شیفت‌ها</option>${['صبح','عصر'].map(x=>`<option ${f.shift===x?'selected':''}>${x}</option>`).join('')}</select></div><div class="field"><label>سکشن</label><select onchange="ui.staffingFilter.section=this.value;renderView()"><option value="">همه سکشن‌ها</option>${state.lists.sections.map(x=>`<option ${f.section===x?'selected':''}>${esc(x)}</option>`).join('')}</select></div><div class="field"><label>پوزیشن</label><select onchange="ui.staffingFilter.position=this.value;renderView()"><option value="">همه پوزیشن‌ها</option>${state.lists.positions.map(x=>`<option ${f.position===x?'selected':''}>${esc(x)}</option>`).join('')}</select></div><button class="btn" onclick="ui.staffingFilter={dayIndex:'',shift:'',section:'',position:''};renderView()">پاک‌کردن فیلتر</button></div></div><div class="card"><div class="table-wrap"><table class="data-table"><thead><tr><th>روز</th><th>شیفت</th><th>سکشن</th><th>پوزیشن</th><th>تعداد موردنیاز</th><th>وضعیت</th><th></th></tr></thead><tbody>${rows.map(r=>`<tr><td>${esc(state.lists.weekdays[Number(r.dayIndex)]||'—')}</td><td>${esc(r.shift)}</td><td>${esc(r.section)}</td><td>${esc(r.position)}</td><td><b>${n(r.requiredCount)}</b></td><td>${badge(r.active===false?'غیرفعال':'فعال')}</td><td class="actions"><button class="btn btn-sm" onclick="editStaffingRequirement('${r.id}')">ویرایش</button> <button class="btn btn-danger btn-sm" onclick="removeItem('staffingRequirements','${r.id}','حذف نیاز نیرو')">حذف</button></td></tr>`).join('')||'<tr><td colspan="7" class="empty">نیازی تعریف نشده است.</td></tr>'}</tbody></table></div></div>`
}
function editStaffingRequirement(id){
  const r=id?(state.staffingRequirements||[]).find(x=>x.id===id):{dayIndex:0,shift:'عصر',section:state.lists.sections[0]||'',position:state.lists.positions[0]||'',requiredCount:1,active:true};
  openForm(id?'ویرایش نیروی موردنیاز':'تعریف نیروی موردنیاز',[{name:'dayIndex',label:'روز هفته',type:'select',options:state.lists.weekdays.map((x,i)=>({value:i,label:x}))},{name:'shift',label:'شیفت',type:'select',options:['صبح','عصر']},{name:'section',label:'سکشن',type:'select',options:state.lists.sections},{name:'position',label:'پوزیشن',type:'select',options:state.lists.positions},{name:'requiredCount',label:'تعداد موردنیاز',type:'number'},{name:'active',label:'فعال',type:'checkbox'}],r,async o=>{
    o.dayIndex=Number(o.dayIndex);o.requiredCount=Math.max(0,n(o.requiredCount));if(!o.section||!o.position||!o.shift||o.requiredCount<1)throw Error('روز، شیفت، سکشن، پوزیشن و تعداد معتبر الزامی است');
    const duplicate=(state.staffingRequirements||[]).find(x=>x.id!==id&&Number(x.dayIndex)===o.dayIndex&&x.shift===o.shift&&x.section===o.section&&x.position===o.position);
    if(duplicate){Object.assign(duplicate,o)}else if(id){Object.assign(r,o)}else state.staffingRequirements.push({id:uid('REQ',state.staffingRequirements),...o});
    closeModal();await commit(id?'ویرایش نیاز نیرو':duplicate?'بروزرسانی نیاز نیروی تکراری':'تعریف نیاز نیرو')
  })
}
function getPlan(weekStart,create=true){let p=state.weeklyPlans.find(x=>x.weekStart===weekStart);if(!p&&create){p={id:uid('WPL',state.weeklyPlans),weekStart,notes:'',cells:{}};state.weeklyPlans.push(p)}return p}

function ensureMonthlySelectedDate(){const f=ui.monthlyPlan,len=jMonthLength(f.year,f.month),p=parseJDate(f.selectedDate);if(!p||p.y!==Number(f.year)||p.m!==Number(f.month))f.selectedDate=jDate(f.year,f.month,1);else if(p.d>len)f.selectedDate=jDate(f.year,f.month,len);return f.selectedDate}
function viewsMonthlyShiftPlan(){const f=ui.monthlyPlan;f.year=Number(f.year)||parseJDate(todayJ()).y;f.month=Number(f.month)||1;const selected=ensureMonthlySelectedDate(),plan=getMonthlyPlan(f.year,f.month,true),len=jMonthLength(f.year,f.month),days=[];for(let d=1;d<=len;d++){const date=jDate(f.year,f.month,d),c=monthlyDayCoverage(plan,date),hi=holidayInfo(date);days.push(`<button class="month-day ${c.status} ${hi.type} ${date===selected?'selected':''}" onclick="ui.monthlyPlan.selectedDate='${date}';renderView()"><span class="day-num">${d}</span> <span class="day-week">${esc(weekdayOf(date))}</span>${hi.title?`<div class="badge ${hi.type==='holiday-official'?'danger':'warn'}">${esc(hi.title)}</div>`:''}<div class="day-status"><span>صبح: ${c.morning.status==='complete'?'کامل':c.morning.status==='shortage'?`کمبود ${c.morning.shortage}`:c.morning.status==='surplus'?`مازاد ${c.morning.surplus}`:'بدون الگو'}</span><span>عصر: ${c.evening.status==='complete'?'کامل':c.evening.status==='shortage'?`کمبود ${c.evening.shortage}`:c.evening.status==='surplus'?`مازاد ${c.evening.surplus}`:'بدون الگو'}</span></div></button>`)}const rows=monthlyPlanRows(plan,selected),di=dayIndexOfDate(selected);return pageHead('برنامه ماهانه شیفت','برنامه هر روز ماه جدا ذخیره می‌شود؛ ماه جدید را از ماه قبل کپی و سپس اصلاح کنید.',`<button class="btn" onclick="copyPreviousMonthPlan()">کپی از ماه قبل</button> <button class="btn" onclick="goView('annualCalendar')">تقویم تعطیلات</button> <button class="btn btn-success" onclick="commitMonthlyPlanToHistory()">ثبت ماه در سوابق شیفت</button>`)+`<div class="card"><div class="month-toolbar"><div class="field"><label>سال</label><input type="number" value="${f.year}" onchange="ui.monthlyPlan.year=+this.value;ensureMonthlySelectedDate();renderView()"></div><div class="field"><label>ماه</label><select onchange="ui.monthlyPlan.month=+this.value;ensureMonthlySelectedDate();renderView()">${state.lists.months.map((x,i)=>`<option value="${i+1}" ${i+1===f.month?'selected':''}>${esc(x)}</option>`).join('')}</select></div><div class="field" style="min-width:340px"><label>یادداشت ماه</label><input value="${esc(plan.notes||'')}" onchange="updateMonthlyPlanNote(this.value)"></div><button class="btn btn-danger" onclick="clearMonthlyPlan()">پاک‌کردن برنامه ماه</button></div>${plan.copiedFrom?`<div class="success-box">این ماه از ${esc(plan.copiedFrom)} کپی شده است.</div>`:''}</div><div class="card"><div class="table-wrap"><div class="month-calendar">${days.join('')}</div></div></div><div class="card"><div class="section-head"><div><h2>${esc(selected)} — ${esc(weekdayOf(selected))}</h2><p class="muted">الگوی نیاز: ${holidayInfo(selected).title?esc(holidayInfo(selected).title):esc(state.lists.weekdays[di])}</p></div><button class="btn" onclick="ui.staffingMap.date='${selected}';goView('staffingMap')">نقشه کمبود این روز</button></div><div class="table-wrap"><table class="data-table"><thead><tr><th>سکشن / پوزیشن</th><th>صبح</th><th>عصر</th></tr></thead><tbody>${rows.map(row=>`<tr><td><b>${esc(row.position)}</b><br><small>${esc(row.section||'—')}</small></td>${['صبح','عصر'].map(shift=>{const ids=monthlyPlanCellIds(plan,selected,row.section,row.position,shift),req=requiredCountFor(selected,di,shift,row.section,row.position),delta=ids.length-req,cls=req?delta<0?'coverage-short':delta>0?'coverage-over':'coverage-ok':'';return `<td><div class="shift-cell ${cls}" onclick="openMonthlyShiftPicker('${encodeURIComponent(row.section)}','${encodeURIComponent(row.position)}','${selected}','${shift}')">${req?`<div class="shift-target ${delta<0?'short':delta>0?'over':'ok'}">${ids.length} از ${req}</div>`:''}${ids.length?ids.map(id=>`<span class="chip">${esc(person(id)?.name||id)}</span>`).join(''):'<span class="muted">انتخاب پرسنل…</span>'}</div></td>`}).join('')}</tr>`).join('')||'<tr><td colspan="3" class="empty">برای این روز نیروی موردنیاز تعریف نشده است.</td></tr>'}</tbody></table></div></div>`}
function updateMonthlyPlanNote(v){const p=getMonthlyPlan(ui.monthlyPlan.year,ui.monthlyPlan.month);p.notes=v;p.updatedAt=new Date().toISOString();saveData(false)}
function clearMonthlyPlan(){if(!confirm('تمام برنامه این ماه پاک شود؟'))return;const p=getMonthlyPlan(ui.monthlyPlan.year,ui.monthlyPlan.month);p.cells={};p.copiedFrom='';p.updatedAt=new Date().toISOString();commit('پاک‌کردن برنامه ماهانه شیفت')}
function openMonthlyShiftPicker(sectionEncoded,positionEncoded,date,shift){const section=decodeURIComponent(sectionEncoded||''),position=decodeURIComponent(positionEncoded||''),pr=periodOf(date),plan=getMonthlyPlan(pr.year,pr.month),selected=new Set(monthlyPlanCellIds(plan,date,section,position,shift));monthlyShiftPickerContext={section,position,date,shift};$('modalTitle').textContent=`انتخاب پرسنل — ${date} / ${section} / ${position} / ${shift}`;$('modalBody').innerHTML=`<div class="field full"><label>جست‌وجو</label><input id="multiSearch" oninput="filterMultiList(this.value)" placeholder="نام یا کد پرسنلی"></div><div class="multi-list" id="multiList">${activePersonnel().sort((a,b)=>{const score=x=>((x.section===section)?0:4)+((x.mainPosition===position)?0:(x.backupPosition===position)?1:3);return score(a)-score(b)}).map(x=>`<label class="multi-row" data-search="${esc((x.id+' '+x.name+' '+x.section+' '+x.mainPosition+' '+x.backupPosition).toLowerCase())}"><input type="checkbox" value="${x.id}" ${selected.has(x.id)?'checked':''}><span><b>${esc(x.name)}</b><br><small>${x.id} — ${esc(x.section||'—')} — ${esc(x.mainPosition)}</small></span><span>${x.section===section&&(x.mainPosition===position||x.backupPosition===position)?badge('مرتبط'):''}</span></label>`).join('')}</div>`;$('modalFoot').innerHTML=`<button class="btn" onclick="closeModal()">انصراف</button><button class="btn btn-primary" onclick="saveMonthlyShiftPicker()">ثبت انتخاب‌ها</button>`;$('modalBackdrop').classList.add('open')}
function saveMonthlyShiftPicker(){const {section,position,date,shift}=monthlyShiftPickerContext,pr=periodOf(date),plan=getMonthlyPlan(pr.year,pr.month);plan.cells[monthlyCellKey(date,section,position,shift)]=qsa('#multiList input:checked').map(x=>x.value);plan.updatedAt=new Date().toISOString();closeModal();commit('ویرایش برنامه ماهانه شیفت')}
function sourceDateSameWeekPattern(year,month,targetDate){const di=dayIndexOfDate(targetDate),targetDay=parseJDate(targetDate).d,occ=[];for(let d=1;d<=targetDay;d++)if(dayIndexOfDate(jDate(parseJDate(targetDate).y,parseJDate(targetDate).m,d))===di)occ.push(d);const index=occ.length-1,src=[];for(let d=1;d<=jMonthLength(year,month);d++)if(dayIndexOfDate(jDate(year,month,d))===di)src.push(d);return src.length?jDate(year,month,src[Math.min(index,src.length-1)]):''}
function copyPreviousMonthPlan(){const f=ui.monthlyPlan,target=getMonthlyPlan(f.year,f.month),prev=prevPeriod(f.year,f.month),source=getMonthlyPlan(prev.year,prev.month,false);if(!source||!Object.keys(source.cells||{}).length)return toast('برای ماه قبل برنامه‌ای ثبت نشده است',true);if(Object.keys(target.cells||{}).length&&!confirm('برنامه فعلی ماه مقصد جایگزین شود؟'))return;const cells={};for(let d=1;d<=jMonthLength(f.year,f.month);d++){const targetDate=jDate(f.year,f.month,d),sourceDate=sourceDateSameWeekPattern(prev.year,prev.month,targetDate);for(const [key,ids] of Object.entries(source.cells||{})){const meta=parseMonthlyCellKey(key);if(meta?.date!==sourceDate)continue;cells[monthlyCellKey(targetDate,meta.section,meta.position,meta.shift)]=structuredClone(ids)}}target.cells=cells;target.copiedFrom=`${prev.year}/${String(prev.month).padStart(2,'0')}`;target.updatedAt=new Date().toISOString();commit('کپی برنامه ماه قبل به ماه جدید')}
function commitMonthlyPlanToHistory(){const f=ui.monthlyPlan,plan=getMonthlyPlan(f.year,f.month,false);if(!plan)return;let added=0;for(const [key,ids] of Object.entries(plan.cells||{})){const meta=parseMonthlyCellKey(key);if(!meta)continue;for(const pid of ids){const exists=state.shiftRecords.some(x=>x.date===meta.date&&x.personnelId===pid&&x.shift===meta.shift);if(exists)continue;state.shiftRecords.push({id:uid('SFT',state.shiftRecords),date:meta.date,personnelId:pid,shift:meta.shift,position:meta.position,section:meta.section||person(pid)?.section||'',status:'برنامه‌ریزی‌شده',scheduledHours:meta.shift==='صبح'?state.settings.morningHours:state.settings.eveningHours,actualHours:'',notes:'ثبت از برنامه ماهانه'});added++}}commit(`ثبت ${added} شیفت ماهانه در سوابق`);toast(`${added} رکورد جدید ثبت شد`)}

function viewsShiftPlan(){
  const start=ui.shiftWeekStart||todayJ(),plan=getPlan(start,true),days=state.lists.weekdays,rows=planRows(plan);
  const board=days.map((d,di)=>{const date=addJDays(start,di),hi=holidayInfo(date);return `<div class="coverage-day"><div class="coverage-day-head ${hi.type}">${esc(d)} — ${esc(date)}${hi.title?`<br><small>${esc(hi.title)}؛ الگوی ${hi.templateDayIndex===6?'جمعه':'پنجشنبه'}</small>`:''}</div>${['صبح','عصر'].map(sh=>{const c=coverageFor(plan,start,di,sh),details=c.details.length?c.details.map(x=>`${esc(x.section)} / ${esc(x.position)}: <b>${x.assigned}/${x.required}</b>${x.delta<0?` (کمبود ${Math.abs(x.delta)})`:x.delta>0?` (مازاد ${x.delta})`:''}`).join('<br>'):'نیاز تعریف نشده';return `<div class="coverage-shift ${c.status}"><strong><span>${sh}</span><span>${c.status==='complete'?'✓ تکمیل':c.status==='shortage'?`کمبود ${c.shortage}`:c.status==='surplus'?`مازاد ${c.surplus}`:'—'}</span></strong><div class="coverage-detail">${details}</div></div>`}).join('')}</div>`}).join('');
  return pageHead('برنامه هفتگی شیفت','چیدمان پرسنل بر اساس سکشن، پوزیشن و نیاز تعریف‌شده هر روز و شیفت.',`<button class="btn" onclick="goView('monthlyShiftPlan')">برنامه ماهانه</button> <button class="btn" onclick="goView('staffingMap')">نقشه کمبود</button> <button class="btn" onclick="goView('staffingNeeds')">تنظیم نیروی موردنیاز</button> <button class="btn btn-success" onclick="commitPlanToHistory()">ثبت در سوابق شیفت</button>`)+`<div class="card"><div class="toolbar"><div class="field"><label>تاریخ شروع هفته (شنبه)</label><input value="${esc(start)}" onchange="ui.shiftWeekStart=this.value;renderView()"></div><div class="field" style="min-width:320px"><label>یادداشت هفته</label><input value="${esc(plan.notes||'')}" onchange="updatePlanNote(this.value)"></div><button class="btn btn-danger" onclick="clearWeekPlan()">پاک‌کردن برنامه هفته</button></div><div class="holiday-legend"><span class="official">تعطیل رسمی؛ ظرفیت جمعه</span><span class="eve">روز قبل تعطیل؛ ظرفیت پنجشنبه</span></div></div><div class="card"><div class="section-head"><h2>وضعیت تکمیل هر شیفت</h2></div><div class="coverage-board">${board}</div></div><div class="card"><div class="hint">هر ردیف یک «سکشن + پوزیشن» است. در هر خانه چند پرسنل انتخاب می‌شوند. خانه سبز یعنی ظرفیت کامل، قرمز یعنی کمبود و زرد یعنی مازاد.</div><div class="table-wrap"><table class="data-table shift-grid"><thead><tr><th rowspan="2">سکشن / پوزیشن</th>${days.map((d,i)=>{const date=addJDays(start,i),hi=holidayInfo(date);return `<th colspan="2" class="shift-day-head ${hi.type}">${esc(d)}<br><small>${esc(date)}</small>${hi.title?`<br><small>${esc(hi.title)}</small>`:''}</th>`}).join('')}</tr><tr>${days.map(()=>'<th>صبح</th><th>عصر</th>').join('')}</tr></thead><tbody>${rows.map(row=>`<tr><td class="pos"><div class="shift-row-label"><b>${esc(row.position)}</b><small>${esc(row.section||'بدون سکشن مشخص')}</small></div></td>${days.map((_,di)=>['صبح','عصر'].map(sh=>{const date=addJDays(start,di),ids=planCellIds(plan,row.section,row.position,di,sh),req=requiredCountFor(date,di,sh,row.section,row.position),delta=ids.length-req,cls=req?delta<0?'coverage-short':delta>0?'coverage-over':'coverage-ok':'',tag=req?`<div class="shift-target ${delta<0?'short':delta>0?'over':'ok'}">چیده‌شده ${ids.length} از ${req}</div>`:'';return `<td><div class="shift-cell ${cls}" onclick="openShiftPicker('${encodeURIComponent(row.section)}','${encodeURIComponent(row.position)}',${di},'${sh}')">${tag}${ids.length?ids.map(id=>`<span class="chip">${esc(person(id)?.name||id)}</span>`).join(''):'<span class="muted">انتخاب پرسنل…</span>'}</div></td>`}).join('')).join('')}</tr>`).join('')}</tbody></table></div></div>`
}
function updatePlanNote(v){getPlan(ui.shiftWeekStart).notes=v;saveData(false)}function clearWeekPlan(){if(confirm('تمام انتخاب‌های این هفته پاک شود؟')){getPlan(ui.shiftWeekStart).cells={};commit('پاک‌کردن برنامه هفتگی')}}
function openShiftPicker(sectionEncoded,positionEncoded,dayIndex,shift){
  const section=decodeURIComponent(sectionEncoded||''),position=decodeURIComponent(positionEncoded||'');shiftPickerContext={section,position,dayIndex,shift};const p=getPlan(ui.shiftWeekStart),selected=new Set(planCellIds(p,section,position,dayIndex,shift));
  $('modalTitle').textContent=`انتخاب پرسنل — ${section?section+' / ':''}${position} / ${state.lists.weekdays[dayIndex]} / ${shift}`;
  $('modalBody').innerHTML=`<div class="field full"><label>جست‌وجو</label><input id="multiSearch" oninput="filterMultiList(this.value)" placeholder="نام یا کد پرسنلی"></div><div class="hint">نیروهای همان سکشن و پوزیشن در ابتدای فهرست قرار گرفته‌اند؛ انتخاب نیروی بک‌آپ نیز مجاز است.</div><div class="multi-list" id="multiList">${activePersonnel().sort((a,b)=>{const score=x=>((x.section===section)?0:4)+((x.mainPosition===position)?0:(x.backupPosition===position)?1:3);return score(a)-score(b)}).map(x=>`<label class="multi-row" data-search="${esc((x.id+' '+x.name+' '+x.section+' '+x.mainPosition+' '+x.backupPosition).toLowerCase())}"><input type="checkbox" value="${x.id}" ${selected.has(x.id)?'checked':''}><span><b>${esc(x.name)}</b><br><small class="muted">${x.id} — ${esc(x.section||'بدون سکشن')} — ${esc(x.mainPosition)}${x.backupPosition?' / بک‌آپ '+esc(x.backupPosition):''}</small></span><span>${(x.section===section&&(x.mainPosition===position||x.backupPosition===position))?badge('مرتبط'):''}</span></label>`).join('')}</div>`;
  $('modalFoot').innerHTML=`<button class="btn" onclick="closeModal()">انصراف</button><button class="btn btn-primary" onclick="saveShiftPicker()">ثبت انتخاب‌ها</button>`;$('modalBackdrop').classList.add('open')
}
function filterMultiList(v){v=v.toLowerCase();qsa('#multiList .multi-row').forEach(x=>x.style.display=x.dataset.search.includes(v)?'grid':'none')}
function saveShiftPicker(){const {section,position,dayIndex,shift}=shiftPickerContext,key=planCellKey(section,position,dayIndex,shift);getPlan(ui.shiftWeekStart).cells[key]=qsa('#multiList input:checked').map(x=>x.value);closeModal();commit('ویرایش برنامه شیفت')}

async function commitPlanToHistory(){
  const plan=getPlan(ui.shiftWeekStart,false);if(!plan)return;let added=0;
  for(const [key,ids] of Object.entries(plan.cells)){const meta=parsePlanCellKey(key);if(!meta)continue;const date=addJDays(plan.weekStart,meta.dayIndex);for(const pid of ids){const exists=state.shiftRecords.some(x=>x.date===date&&x.personnelId===pid&&x.shift===meta.shift);if(exists)continue;const p=person(pid);state.shiftRecords.push({id:uid('SFT',state.shiftRecords),date,personnelId:pid,shift:meta.shift,position:meta.position,section:meta.section||p?.section||'',status:'برنامه‌ریزی‌شده',scheduledHours:meta.shift==='صبح'?state.settings.morningHours:state.settings.eveningHours,actualHours:'',notes:''});added++}}
  await commit(`ثبت ${added} شیفت در سوابق`);toast(`${added} رکورد جدید ثبت شد`)
}
function viewsShiftHistory(){const items=[...state.shiftRecords].sort((a,b)=>dateCode(b.date)-dateCode(a.date));return pageHead('سوابق تاریخ‌دار شیفت','هر ردیف یک نفر در یک تاریخ و یک شیفت است.',`<button class="btn btn-primary" onclick="editShiftRecord()">+ ثبت شیفت</button>`)+`<div class="card"><div class="table-wrap"><table class="data-table"><thead><tr><th>تاریخ</th><th>پرسنل</th><th>شیفت</th><th>پوزیشن</th><th>سکشن</th><th>وضعیت</th><th>ساعات برنامه</th><th>ساعات واقعی</th><th>توضیحات</th><th></th></tr></thead><tbody>${items.map(x=>`<tr><td>${esc(x.date)}</td><td>${esc(personLabel(x.personnelId))}</td><td>${esc(x.shift)}</td><td>${esc(x.position)}</td><td>${esc(x.section||'—')}</td><td>${badge(x.status)}</td><td>${dec(x.scheduledHours)}</td><td>${x.actualHours===''?'—':dec(x.actualHours)}</td><td>${esc(x.notes||'')}</td><td><button class="btn btn-sm" onclick="editShiftRecord('${x.id}')">ویرایش</button> <button class="btn btn-danger btn-sm" onclick="removeItem('shiftRecords','${x.id}','حذف سابقه شیفت')">حذف</button></td></tr>`).join('')||'<tr><td colspan="10" class="empty">سوابق شیفت خالی است.</td></tr>'}</tbody></table></div></div>`}
function editShiftRecord(id){const x=id?state.shiftRecords.find(a=>a.id===id):{date:todayJ(),shift:'عصر',status:'انجام‌شده',scheduledHours:state.settings.eveningHours,actualHours:'',position:'',section:''};openForm(id?'ویرایش سابقه شیفت':'ثبت سابقه شیفت',[{name:'date',label:'تاریخ',placeholder:'1405/04/01'},{name:'personnelId',label:'پرسنل',type:'select',options:activePersonnel().map(p=>({value:p.id,label:p.id+' | '+p.name}))},{name:'shift',label:'شیفت',type:'select',options:state.lists.shifts},{name:'position',label:'پوزیشن',type:'select',options:state.lists.positions},{name:'section',label:'سکشن',type:'select',options:state.lists.sections},{name:'status',label:'وضعیت',type:'select',options:state.lists.shiftStatuses},{name:'scheduledHours',label:'ساعات برنامه',type:'number'},{name:'actualHours',label:'ساعات واقعی',type:'number'},{name:'notes',label:'توضیحات',type:'textarea',full:true}],x,async o=>{if(!parseJDate(o.date)||!o.personnelId)throw Error('تاریخ و پرسنل الزامی است');if(id)Object.assign(x,o);else state.shiftRecords.push({id:uid('SFT',state.shiftRecords),...o});closeModal();await commit(id?'ویرایش سابقه شیفت':'ثبت سابقه شیفت')})}
function dateCode(s){return parseJDate(s)?.code||0}
function viewsShiftReport(){const f=ui.shiftReport,rows=state.shiftRecords.filter(x=>(!f.personnelId||x.personnelId===f.personnelId)&&(!f.from||dateCode(x.date)>=dateCode(f.from))&&(!f.to||dateCode(x.date)<=dateCode(f.to))).sort((a,b)=>dateCode(a.date)-dateCode(b.date));const totalHours=rows.reduce((s,x)=>s+n(x.actualHours!==''?x.actualHours:x.scheduledHours),0);return pageHead('گزارش شیفت پرسنل','گزارش دقیق بین روز اول تا آخر هر ماه یا هر بازه دلخواه.')+`<div class="card"><div class="toolbar"><div class="field"><label>پرسنل</label><select onchange="ui.shiftReport.personnelId=this.value;renderView()">${allPersonOptions(f.personnelId,true)}</select></div><div class="field"><label>از تاریخ</label><input value="${esc(f.from)}" onchange="ui.shiftReport.from=this.value;renderView()" placeholder="1405/04/01"></div><div class="field"><label>تا تاریخ</label><input value="${esc(f.to)}" onchange="ui.shiftReport.to=this.value;renderView()" placeholder="1405/04/31"></div></div></div><div class="grid grid-4"><div class="card kpi"><div class="label">کل شیفت</div><div class="value">${rows.length}</div></div><div class="card kpi"><div class="label">شیفت صبح</div><div class="value">${rows.filter(x=>x.shift==='صبح').length}</div></div><div class="card kpi"><div class="label">شیفت عصر</div><div class="value">${rows.filter(x=>x.shift==='عصر').length}</div></div><div class="card kpi"><div class="label">مجموع ساعات</div><div class="value">${dec(totalHours)}</div></div></div><div class="card"><div class="table-wrap"><table class="data-table"><thead><tr><th>تاریخ</th><th>روز هفته</th><th>پرسنل</th><th>شیفت</th><th>پوزیشن</th><th>سکشن</th><th>وضعیت</th><th>ساعات</th><th>توضیحات</th></tr></thead><tbody>${rows.map(x=>`<tr><td>${x.date}</td><td>${weekdayOf(x.date)}</td><td>${esc(personLabel(x.personnelId))}</td><td>${x.shift}</td><td>${x.position}</td><td>${x.section||'—'}</td><td>${badge(x.status)}</td><td>${dec(x.actualHours!==''?x.actualHours:x.scheduledHours)}</td><td>${esc(x.notes||'')}</td></tr>`).join('')||'<tr><td colspan="9" class="empty">رکوردی در این بازه نیست.</td></tr>'}</tbody></table></div></div>`}
function weekdayOf(s){const p=parseJDate(s);if(!p)return'—';const g=toGregorian(p.y,p.m,p.d),d=new Date(g.gy,g.gm-1,g.gd).getDay();return ['یکشنبه','دوشنبه','سه‌شنبه','چهارشنبه','پنجشنبه','جمعه','شنبه'][d]}
function adjFor(pid,y,m){let a=state.monthlyAdjustments.find(x=>x.personnelId===pid&&x.year===y&&x.month===m);if(!a){a={id:uid('ADJ',state.monthlyAdjustments),personnelId:pid,year:y,month:m,hoursOverride:'',overtimePerformance:0,otherPayment:0,otherDeduction:0,notes:''};state.monthlyAdjustments.push(a)}return a}
function tipShares(group){const ps=(group.participants||[]).filter(x=>person(x.personnelId));const sum=ps.reduce((s,x)=>s+(n(x.weight)||1),0)||1;return ps.map(x=>({...x,amount:n(group.totalAmount)*(n(x.weight)||1)/sum}))}
function periodHasData(pid,y,m){return Boolean(payrollClosure(y,m)?.rows?.some(x=>x.personnelId===pid))||state.monthlyAdjustments.some(x=>x.personnelId===pid&&x.year===y&&x.month===m)||state.payments.some(x=>x.personnelId===pid&&x.salaryYear===y&&x.salaryMonth===m)||state.shiftRecords.some(x=>x.personnelId===pid&&periodOf(x.date).year===y&&periodOf(x.date).month===m)||state.penaltiesRewards.some(x=>x.personnelId===pid&&x.year===y&&x.month===m)||state.delays.some(x=>x.personnelId===pid&&x.year===y&&x.month===m)||state.consumptions.some(x=>x.personnelId===pid&&x.year===y&&x.month===m)||state.tipGroups.some(g=>{const q=periodOf(g.receiveDate);return q.year===y&&q.month===m&&tipShares(g).some(t=>t.personnelId===pid)})}
function calcPayrollLive(p,y,m,memo={}){const key=`${p.id}|${y}|${m}`;if(memo[key])return memo[key];const a=state.monthlyAdjustments.find(x=>x.personnelId===p.id&&x.year===y&&x.month===m)||{hoursOverride:'',overtimePerformance:0,otherPayment:0,otherDeduction:0,notes:''},prev=prevPeriod(y,m),prevRow=(y>1300&&periodHasData(p.id,prev.year,prev.month)?calcPayroll(p,prev.year,prev.month,memo):{unpaid:0});const penalties=state.penaltiesRewards.filter(x=>x.personnelId===p.id&&x.year===y&&x.month===m&&x.status==='تاییدشده');const penalty=penalties.filter(x=>x.type==='جریمه').reduce((s,x)=>s+n(x.amount),0),reward=penalties.filter(x=>x.type==='تشویقی').reduce((s,x)=>s+n(x.amount),0);const payments=state.payments.filter(x=>x.personnelId===p.id&&x.salaryYear===y&&x.salaryMonth===m),advance=payments.filter(x=>x.type==='مساعده').reduce((s,x)=>s+n(x.amount),0),paid=payments.filter(x=>x.type!=='مساعده').reduce((s,x)=>s+n(x.amount),0);const cons=state.consumptions.filter(x=>x.personnelId===p.id&&x.year===y&&x.month===m),creditConsumed=cons.filter(x=>x.type==='اعتبار').reduce((s,x)=>s+n(x.amount),0),mealConsumed=cons.filter(x=>x.type==='غذای پرسنلی').reduce((s,x)=>s+n(x.amount),0),creditLimit=n(p.monthlyCredit)||n(state.settings.defaultMonthlyCredit),mealLimit=n(p.mealCredit)||n(state.settings.defaultMealCredit),creditRemaining=creditLimit-creditConsumed,mealRemaining=mealLimit-mealConsumed;const shiftRows=state.shiftRecords.filter(x=>x.personnelId===p.id&&periodOf(x.date).year===y&&periodOf(x.date).month===m&&!['لغوشده','مرخصی','غیبت'].includes(x.status)),derivedHours=shiftRows.reduce((s,x)=>s+n(x.actualHours!==''?x.actualHours:x.scheduledHours),0),hours=a.hoursOverride===''?derivedHours:n(a.hoursOverride);const delayHours=state.delays.filter(x=>x.personnelId===p.id&&x.year===y&&x.month===m).reduce((s,x)=>s+calcDelay(x).hours,0),hourly=n(p.hourlyRate)||n(state.settings.baseHourlyRate),fixedContract=p.salaryContract?.type==='fixedMonthly'&&n(p.salaryContract.monthlySalary)>0,wage=fixedContract?n(p.salaryContract.monthlySalary):Math.max(0,hours-delayHours)*hourly;const tips=state.tipGroups.filter(g=>{const q=periodOf(g.receiveDate);return q.year===y&&q.month===m&&g.status!=='ابطال‌شده'}).reduce((s,g)=>s+(tipShares(g).find(x=>x.personnelId===p.id)?.amount||0),0);const transport=n(p.transportMonthly)||n(state.settings.defaultTransport),fixed=n(p.fixedAllowance),overtime=n(a.overtimePerformance),otherPay=n(a.otherPayment),otherDed=n(a.otherDeduction),gross=wage+overtime+transport+fixed+reward+tips+otherPay,insurance=p.insurance==='دارد'?(wage+overtime+fixed)*n(state.settings.employeeInsuranceRate):0,netToman=Math.max(0,gross-penalty-insurance-otherDed-Math.max(0,-creditRemaining)-Math.max(0,-mealRemaining)),unpaid=Math.max(0,n(prevRow.unpaid)+netToman-advance-paid),status=unpaid<=.5?'تسویه‌شده':(advance+paid>0?'پرداخت ناقص':'پرداخت‌نشده');const row={personnelId:p.id,year:y,month:m,previousBalance:n(prevRow.unpaid),penalty,reward,advance,paid,creditConsumed,creditRemaining,mealRemaining,transport,hours,delayHours,hourly,overtime,fixed,otherPayment:otherPay,otherDeduction:otherDed,wage,tips,gross,insurance,netRial:netToman*n(state.settings.tomanToRial),netToman,unpaid,status,notes:a.notes};memo[key]=row;return row}

function calcPayroll(p,y,m,memo={}){const c=payrollClosure(y,m),r=c?.rows?.find(x=>x.personnelId===p.id);return r?structuredClone(r):calcPayrollLive(p,y,m,memo)}
function payrollPeopleForPeriod(y,m){return state.personnel.filter(p=>p.status==='فعال'||periodHasData(p.id,y,m))}
function payrollRowsForPeriod(y,m){const c=payrollClosure(y,m);return c?structuredClone(c.rows||[]):payrollPeopleForPeriod(y,m).map(p=>calcPayrollLive(p,y,m,{}))}
function finalizePayrollMonth(){const y=ui.payroll.year,m=ui.payroll.month;if(payrollClosure(y,m))return toast('این ماه قبلاً قطعی شده است',true);openForm(`قطعی‌کردن حقوق ${monthName(m)} ${y}`,[{name:'finalizedBy',label:'نهایی‌کننده'},{name:'notes',label:'توضیحات سند قطعی',type:'textarea',full:true}],{finalizedBy:'',notes:''},async o=>{if(!o.finalizedBy)throw Error('نام نهایی‌کننده را وارد کنید');const people=payrollPeopleForPeriod(y,m),rows=people.map(p=>({...calcPayrollLive(p,y,m,{}),personnelName:p.name,personnelCode:p.id,personnelSection:p.section||'',personnelPosition:p.mainPosition||''})),payments=structuredClone(state.payments.filter(x=>Number(x.salaryYear)===Number(y)&&Number(x.salaryMonth)===Number(m))),closure={id:uid('PCL',state.payrollClosures),year:y,month:m,version:(state.payrollClosures.filter(x=>x.year===y&&x.month===m).length+1),active:true,finalizedAt:new Date().toISOString(),finalizedBy:o.finalizedBy,notes:o.notes,rows,payments,totals:{netToman:rows.reduce((s,x)=>s+n(x.netToman),0),paid:rows.reduce((s,x)=>s+n(x.paid)+n(x.advance),0),unpaid:rows.reduce((s,x)=>s+n(x.unpaid),0)}};state.payrollClosures.push(closure);closeModal();await commit(`قطعی‌کردن حقوق ${monthName(m)} ${y}`)})}
function reopenPayrollMonth(){const c=payrollClosure(ui.payroll.year,ui.payroll.month);if(!c)return;if(!confirm('ماه قطعی بازگشایی شود؟ محاسبات دوباره از داده‌های جاری انجام خواهد شد.'))return;c.active=false;c.reopenedAt=new Date().toISOString();commit(`بازگشایی حقوق ${monthName(c.month)} ${c.year}`)}
function showPayrollClosure(id=''){const c=id?state.payrollClosures.find(x=>x.id===id):payrollClosure(ui.payroll.year,ui.payroll.month);if(!c)return;const payments=c.payments||[];$('modalTitle').textContent=`سند قطعی حقوق — ${monthName(c.month)} ${c.year}`;$('modalBody').innerHTML=`<div class="closed-banner"><b>نسخه ${c.version}</b> — نهایی‌کننده: ${esc(c.finalizedBy||'—')} — ${esc(new Date(c.finalizedAt).toLocaleString('fa-IR'))}<br>${esc(c.notes||'')}</div><div class="grid grid-3" style="margin-top:12px"><div class="card kpi"><div class="label">حقوق خالص</div><div class="value">${money(c.totals?.netToman)}</div></div><div class="card kpi"><div class="label">پرداخت و مساعده</div><div class="value">${money(c.totals?.paid)}</div></div><div class="card kpi"><div class="label">مانده</div><div class="value">${money(c.totals?.unpaid)}</div></div></div><h3>پرداخت‌های ذخیره‌شده در سند</h3><div class="table-wrap snapshot-table"><table class="data-table"><thead><tr><th>تاریخ</th><th>پرسنل</th><th>نوع</th><th>مبلغ</th><th>روش</th><th>پیگیری</th></tr></thead><tbody>${payments.map(x=>`<tr><td>${esc(x.date)}</td><td>${esc(personLabel(x.personnelId))}</td><td>${esc(x.type)}</td><td>${money(x.amount)}</td><td>${esc(x.method||'—')}</td><td>${esc(x.tracking||'—')}</td></tr>`).join('')||'<tr><td colspan="6" class="empty">پرداختی در زمان نهایی‌سازی ثبت نشده بود.</td></tr>'}</tbody></table></div>`;$('modalFoot').innerHTML=`<button class="btn" onclick="closeModal()">بستن</button><button class="btn btn-primary" onclick="downloadPayrollClosure('${c.id}')">دانلود Snapshot JSON</button>`;$('modalBackdrop').classList.add('open')}
function downloadPayrollClosure(id=''){const c=id?state.payrollClosures.find(x=>x.id===id):payrollClosure(ui.payroll.year,ui.payroll.month);if(!c)return;const blob=new Blob([JSON.stringify(c,null,2)],{type:'application/json;charset=utf-8'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`Rayo_Payroll_${c.year}_${String(c.month).padStart(2,'0')}_Final.json`;a.click();URL.revokeObjectURL(a.href)}

function calcPayrollShallowPrevious(p,y,m){const a=state.monthlyAdjustments.find(x=>x.personnelId===p.id&&x.year===y&&x.month===m);const hasData=a||state.payments.some(x=>x.personnelId===p.id&&x.salaryYear===y&&x.salaryMonth===m)||state.shiftRecords.some(x=>x.personnelId===p.id&&periodOf(x.date).year===y&&periodOf(x.date).month===m);if(!hasData)return{unpaid:0};const temp=calcPayrollNoPrevious(p,y,m);return{unpaid:temp.unpaid}}
function calcPayrollNoPrevious(p,y,m){const a=state.monthlyAdjustments.find(x=>x.personnelId===p.id&&x.year===y&&x.month===m)||{hoursOverride:'',overtimePerformance:0,otherPayment:0,otherDeduction:0};const penalties=state.penaltiesRewards.filter(x=>x.personnelId===p.id&&x.year===y&&x.month===m&&x.status==='تاییدشده'),penalty=penalties.filter(x=>x.type==='جریمه').reduce((s,x)=>s+n(x.amount),0),reward=penalties.filter(x=>x.type==='تشویقی').reduce((s,x)=>s+n(x.amount),0);const pays=state.payments.filter(x=>x.personnelId===p.id&&x.salaryYear===y&&x.salaryMonth===m),advance=pays.filter(x=>x.type==='مساعده').reduce((s,x)=>s+n(x.amount),0),paid=pays.filter(x=>x.type!=='مساعده').reduce((s,x)=>s+n(x.amount),0);const shiftRows=state.shiftRecords.filter(x=>x.personnelId===p.id&&periodOf(x.date).year===y&&periodOf(x.date).month===m&&!['لغوشده','مرخصی','غیبت'].includes(x.status)),hours=a.hoursOverride===''?shiftRows.reduce((s,x)=>s+n(x.actualHours!==''?x.actualHours:x.scheduledHours),0):n(a.hoursOverride),delayHours=state.delays.filter(x=>x.personnelId===p.id&&x.year===y&&x.month===m).reduce((s,x)=>s+calcDelay(x).hours,0),hourly=n(p.hourlyRate)||n(state.settings.baseHourlyRate),fixedContract=p.salaryContract?.type==='fixedMonthly'&&n(p.salaryContract.monthlySalary)>0,wage=fixedContract?n(p.salaryContract.monthlySalary):Math.max(0,hours-delayHours)*hourly;const tips=state.tipGroups.filter(g=>{const q=periodOf(g.receiveDate);return q.year===y&&q.month===m&&g.status!=='ابطال‌شده'}).reduce((s,g)=>s+(tipShares(g).find(x=>x.personnelId===p.id)?.amount||0),0);const cons=state.consumptions.filter(x=>x.personnelId===p.id&&x.year===y&&x.month===m),cr=(n(p.monthlyCredit)||n(state.settings.defaultMonthlyCredit))-cons.filter(x=>x.type==='اعتبار').reduce((s,x)=>s+n(x.amount),0),mr=(n(p.mealCredit)||n(state.settings.defaultMealCredit))-cons.filter(x=>x.type==='غذای پرسنلی').reduce((s,x)=>s+n(x.amount),0);const gross=wage+n(a.overtimePerformance)+(n(p.transportMonthly)||n(state.settings.defaultTransport))+n(p.fixedAllowance)+reward+tips+n(a.otherPayment),insurance=p.insurance==='دارد'?(wage+n(a.overtimePerformance)+n(p.fixedAllowance))*n(state.settings.employeeInsuranceRate):0,net=Math.max(0,gross-penalty-insurance-n(a.otherDeduction)-Math.max(0,-cr)-Math.max(0,-mr));return{unpaid:Math.max(0,net-advance-paid)}}
function viewsPayroll(){const y=ui.payroll.year,m=ui.payroll.month,c=payrollClosure(y,m),rows=payrollRowsForPeriod(y,m),actions=c?`<button class="btn" onclick="showPayrollClosure()">مشاهده سند قطعی</button> <button class="btn btn-danger" onclick="reopenPayrollMonth()">بازگشایی ماه</button>`:`<button class="btn btn-success" onclick="finalizePayrollMonth()">✓ قطعی‌کردن حقوق ماه</button>`;return pageHead('کارکرد ماه و محاسبه حقوق',c?'این ماه قطعی است و اعداد از Snapshot ذخیره‌شده خوانده می‌شوند.':'مقادیر رویدادی از انعام، جریمه، پرداخت، مصرف و تأخیر خودکار جمع می‌شوند.',actions)+`<div class="card"><div class="toolbar"><div class="field"><label>سال</label><input type="number" value="${y}" onchange="ui.payroll.year=+this.value;renderView()"></div><div class="field"><label>ماه</label><select onchange="ui.payroll.month=+this.value;renderView()">${state.lists.months.map((x,i)=>`<option value="${i+1}" ${i+1===m?'selected':''}>${x}</option>`).join('')}</select></div></div>${c?`<div class="closed-banner"><span class="lock-icon">🔒</span> نهایی‌شده توسط <b>${esc(c.finalizedBy||'—')}</b> در ${esc(new Date(c.finalizedAt).toLocaleString('fa-IR'))}. پرداخت‌های همان زمان نیز داخل سند ذخیره شده‌اند.</div>`:'<div class="hint">بعد از کنترل ساعت‌ها، کسورات و پرداخت‌ها، ماه را قطعی کنید تا تغییر تنظیمات آینده روی آن اثر نگذارد.</div>'}</div><div class="card"><div class="table-wrap"><table class="data-table"><thead><tr><th>پرسنل</th><th>مانده قبل</th><th>جریمه</th><th>تشویقی</th><th>مساعده</th><th>پرداختی</th><th>ساعت</th><th>تأخیر</th><th>نرخ ساعتی</th><th>حقوق ساعت</th><th>انعام</th><th>ناخالص</th><th>بیمه</th><th>خالص (ریال)</th><th>مانده پرداخت</th><th>وضعیت</th><th></th></tr></thead><tbody>${rows.map(r=>`<tr><td>${esc(r.personnelCode&&r.personnelName?`${r.personnelCode} | ${r.personnelName}`:personLabel(r.personnelId))}</td><td class="num">${money(r.previousBalance)}</td><td class="num">${money(r.penalty)}</td><td class="num">${money(r.reward)}</td><td class="num">${money(r.advance)}</td><td class="num">${money(r.paid)}</td><td>${dec(r.hours)}</td><td>${dec(r.delayHours)}</td><td class="num">${money(r.hourly)}</td><td class="num">${money(r.wage)}</td><td class="num">${money(r.tips)}</td><td class="num">${money(r.gross)}</td><td class="num">${money(r.insurance)}</td><td class="num">${money(r.netRial)}</td><td class="num">${money(r.unpaid)}</td><td>${badge(r.status)}</td><td>${c?'<span class="badge success">قفل</span>':`<button class="btn btn-sm" onclick="editMonthlyAdjustment('${r.personnelId}')">ورودی دستی</button>`}</td></tr>`).join('')||'<tr><td colspan="17" class="empty">رکوردی برای این ماه وجود ندارد.</td></tr>'}</tbody></table></div></div>${(()=>{const versions=state.payrollClosures.filter(x=>Number(x.year)===Number(y)&&Number(x.month)===Number(m)).sort((a,b)=>String(b.finalizedAt||'').localeCompare(String(a.finalizedAt||'')));return versions.length?`<div class="card"><div class="section-head"><h2>نسخه‌های ذخیره‌شده این ماه</h2></div><div class="table-wrap"><table class="data-table"><thead><tr><th>نسخه</th><th>زمان نهایی‌سازی</th><th>نهایی‌کننده</th><th>وضعیت</th><th>مانده</th><th></th></tr></thead><tbody>${versions.map(v=>`<tr><td>${v.version}</td><td>${esc(new Date(v.finalizedAt).toLocaleString('fa-IR'))}</td><td>${esc(v.finalizedBy||'—')}</td><td>${v.active!==false?'<span class="badge success">فعال/قطعی</span>':'<span class="badge warn">بازگشایی‌شده</span>'}</td><td>${money(v.totals?.unpaid)}</td><td><button class="btn btn-sm" onclick="showPayrollClosure('${v.id}')">مشاهده</button> <button class="btn btn-sm" onclick="downloadPayrollClosure('${v.id}')">JSON</button></td></tr>`).join('')}</tbody></table></div></div>`:''})()}`}
function editMonthlyAdjustment(pid){if(isPeriodClosed(ui.payroll.year,ui.payroll.month))return toast('ماه قطعی است؛ ابتدا آن را بازگشایی کنید',true);const a=adjFor(pid,ui.payroll.year,ui.payroll.month);openForm(`ورودی‌های دستی — ${personLabel(pid)}`,[{name:'hoursOverride',label:'ساعات کار (خالی = از سوابق شیفت)',type:'number'},{name:'overtimePerformance',label:'اضافه‌کار/کارانه',type:'number'},{name:'otherPayment',label:'سایر پرداخت',type:'number'},{name:'otherDeduction',label:'سایر کسورات',type:'number'},{name:'notes',label:'توضیحات',type:'textarea',full:true}],a,async o=>{Object.assign(a,o);closeModal();await commit('ویرایش ورودی ماهانه حقوق')})}
function viewsPayslip(){const f=ui.payslip,p=f.personnelId?person(f.personnelId):activePersonnel()[0];if(p&&!f.personnelId)f.personnelId=p.id;const r=p?calcPayroll(p,f.year,f.month):null,c=payrollClosure(f.year,f.month);return pageHead('فیش حقوقی',c?'فیش قطعی از Snapshot ذخیره‌شده ماه.':'نسخه قابل چاپ برای هر پرسنل و ماه.',`<button class="btn btn-primary no-print" onclick="window.print()">چاپ فیش</button>`)+`<div class="card no-print"><div class="toolbar"><div class="field"><label>سال</label><input type="number" value="${f.year}" onchange="ui.payslip.year=+this.value;renderView()"></div><div class="field"><label>ماه</label><select onchange="ui.payslip.month=+this.value;renderView()">${state.lists.months.map((x,i)=>`<option value="${i+1}" ${i+1===f.month?'selected':''}>${x}</option>`).join('')}</select></div><div class="field"><label>پرسنل</label><select onchange="ui.payslip.personnelId=this.value;renderView()">${allPersonOptions(f.personnelId)}</select></div>${c?'<span class="badge success">🔒 ماه قطعی</span>':''}</div></div><div class="card print-card">${r?renderPayslip(p,r):'<div class="empty">پرسنلی انتخاب نشده است.</div>'}</div>`}
function renderPayslip(p,r){const pairs=[['نام',r.personnelName||p.name],['کد پرسنلی',r.personnelCode||p.id],['سال / ماه',`${r.year} / ${monthName(r.month)}`],['سکشن',r.personnelSection||p.section||'—'],['دستمزد ساعتی',money(r.hourly)+' تومان'],['ساعات کار',dec(r.hours)],['تأخیر',dec(r.delayHours)+' ساعت'],['مانده از ماه قبل',money(r.previousBalance)+' تومان'],['حقوق براساس ساعت',money(r.wage)+' تومان'],['اضافه‌کار/کارانه',money(r.overtime)+' تومان'],['رفت‌وآمد',money(r.transport)+' تومان'],['فوق‌العاده ثابت',money(r.fixed)+' تومان'],['تشویقی',money(r.reward)+' تومان'],['انعام',money(r.tips)+' تومان'],['سایر پرداخت',money(r.otherPayment)+' تومان'],['حقوق ناخالص',money(r.gross)+' تومان'],['جریمه',money(r.penalty)+' تومان'],['سهم بیمه شاغل',money(r.insurance)+' تومان'],['سایر کسورات',money(r.otherDeduction)+' تومان'],['اضافه مصرف اعتبار',money(Math.max(0,-r.creditRemaining))+' تومان'],['اضافه مصرف غذا',money(Math.max(0,-r.mealRemaining))+' تومان'],['مساعده',money(r.advance)+' تومان'],['پرداختی',money(r.paid)+' تومان'],['حقوق قطعی پس از کسری‌ها',money(r.netRial)+' ریال'],['مانده واریز نشده',money(r.unpaid)+' تومان'],['وضعیت',r.status]];return `<div class="payslip"><h2>فیش حقوق پرسنل — کافه‌رستوران رایو</h2><div class="payslip-grid">${pairs.map(([a,b])=>`<div>${a}</div><div>${b}</div>`).join('')}</div><p><b>توضیحات:</b> ${esc(r.notes||'—')}</p></div>`}
function viewsTips(){const total=state.tipGroups.filter(x=>x.status!=='ابطال‌شده').reduce((s,x)=>s+n(x.totalAmount),0),settled=state.tipGroups.reduce((s,x)=>s+effectiveSettled(x),0);return pageHead('انعام و تقسیم خودکار سهم','مبلغ کل گروه یک‌بار ثبت می‌شود؛ سهم افراد براساس ضریب محاسبه می‌شود.',`<button class="btn btn-primary" onclick="editTip()">+ ثبت گروه انعام</button>`)+`<div class="grid grid-3"><div class="card kpi"><div class="label">کل انعام ثبت‌شده</div><div class="value">${money(total)}</div></div><div class="card kpi"><div class="label">تسویه‌شده</div><div class="value">${money(settled)}</div></div><div class="card kpi"><div class="label">مانده</div><div class="value">${money(total-settled)}</div></div></div><div class="card"><div class="table-wrap"><table class="data-table"><thead><tr><th>کد گروه</th><th>تاریخ</th><th>نوع/گروه</th><th>مبلغ کل</th><th>تعداد</th><th>تقسیم سهم</th><th>تسویه</th><th>وضعیت</th><th></th></tr></thead><tbody>${[...state.tipGroups].sort((a,b)=>dateCode(b.receiveDate)-dateCode(a.receiveDate)).map(g=>{const shares=tipShares(g),sum=shares.reduce((s,x)=>s+x.amount,0);return `<tr><td>${g.id}</td><td>${g.receiveDate}</td><td>${esc(g.type)} / ${esc(g.hallGroup||'—')}</td><td class="num">${money(g.totalAmount)}</td><td>${shares.length}</td><td>${shares.map(x=>`${esc(person(x.personnelId)?.name||x.personnelId)}: <b>${money(x.amount)}</b>`).join('<br>')}<br><small class="${Math.abs(sum-n(g.totalAmount))<1?'positive':'danger-text'}">مغایرت: ${money(n(g.totalAmount)-sum)}</small></td><td class="num">${money(effectiveSettled(g))}</td><td>${badge(g.status)}</td><td><button class="btn btn-sm" onclick="editTip('${g.id}')">ویرایش</button> <button class="btn btn-danger btn-sm" onclick="removeItem('tipGroups','${g.id}','حذف گروه انعام')">حذف</button></td></tr>`}).join('')||'<tr><td colspan="9" class="empty">گروه انعامی ثبت نشده است.</td></tr>'}</tbody></table></div></div>`}
function tipCode(date){const p=parseJDate(date)||parseJDate(todayJ()),prefix=`TIPG-${p.y}${String(p.m).padStart(2,'0')}-`;let mx=0;state.tipGroups.filter(x=>x.id.startsWith(prefix)).forEach(x=>mx=Math.max(mx,+x.id.split('-').pop()));return prefix+String(mx+1).padStart(4,'0')}
function editTip(id){const g=id?state.tipGroups.find(x=>x.id===id):{receiveDate:todayJ(),type:'گروهی',hallGroup:'کل سالن',totalAmount:0,receiveMethod:'نقدی',status:'ثبت‌شده',settledAmount:0,settlementDate:'',settlementMethod:'',notes:'',participants:[]};const sel=new Map((g.participants||[]).map(x=>[x.personnelId,x.weight]));$('modalTitle').textContent=id?'ویرایش گروه انعام':'ثبت گروه انعام';$('modalBody').innerHTML=`<div class="form-grid"><div class="field"><label>تاریخ دریافت</label><input id="tip_date" value="${esc(g.receiveDate)}"></div><div class="field"><label>نوع انعام</label><select id="tip_type">${optionList(state.lists.tipTypes,g.type)}</select></div><div class="field"><label>گروه سالن</label><select id="tip_hall">${optionList(state.lists.hallGroups,g.hallGroup)}</select></div><div class="field"><label>مبلغ کل (تومان)</label><input type="number" id="tip_total" value="${n(g.totalAmount)}"></div><div class="field"><label>نحوه دریافت</label><select id="tip_receive">${optionList(state.lists.paymentMethods,g.receiveMethod)}</select></div><div class="field"><label>وضعیت</label><select id="tip_status">${optionList(state.lists.tipStatuses,g.status)}</select></div><div class="field"><label>مبلغ تسویه‌شده (تومان)</label><input type="number" id="tip_settled" value="${n(g.settledAmount)}"></div><div class="field"><label>تاریخ تسویه</label><input id="tip_settle_date" value="${esc(g.settlementDate||'')}"></div><div class="field"><label>نحوه تسویه</label><select id="tip_settle_method"><option value="">انتخاب کنید</option>${optionList(state.lists.settlementMethods,g.settlementMethod)}</select></div><div class="field full"><label>توضیحات</label><textarea id="tip_notes">${esc(g.notes||'')}</textarea></div></div><h4>افراد مشمول و ضریب سهم</h4><div class="hint">ضریب خالی یا ۱ یعنی سهم مساوی. برای سهم دوبرابر، ضریب ۲ وارد کنید.</div><div class="multi-list" id="tipPeople">${activePersonnel().map(p=>`<label class="multi-row"><input type="checkbox" value="${p.id}" ${sel.has(p.id)?'checked':''}><span><b>${esc(p.name)}</b><br><small>${p.id} — ${esc(p.mainPosition)}</small></span><input type="number" step="0.1" min="0.1" value="${sel.get(p.id)||1}" aria-label="ضریب سهم"></label>`).join('')}</div>`;$('modalFoot').innerHTML=`<button class="btn" onclick="closeModal()">انصراف</button><button class="btn btn-primary" onclick="saveTip('${id||''}')">ذخیره</button>`;$('modalBackdrop').classList.add('open')}
function saveTip(id){const date=$('tip_date').value;if(!parseJDate(date))return toast('تاریخ معتبر وارد کنید',true);const total=n($('tip_total').value),participants=qsa('#tipPeople .multi-row').filter(r=>qs('input[type=checkbox]',r).checked).map(r=>({personnelId:qs('input[type=checkbox]',r).value,weight:n(qs('input[type=number]',r).value)||1}));if(total<=0||!participants.length)return toast('مبلغ و حداقل یک نفر الزامی است',true);const o={receiveDate:date,type:$('tip_type').value,hallGroup:$('tip_hall').value,totalAmount:total,receiveMethod:$('tip_receive').value,status:$('tip_status').value,settledAmount:n($('tip_settled').value),settlementDate:$('tip_settle_date').value,settlementMethod:$('tip_settle_method').value,notes:$('tip_notes').value,participants};if(id)Object.assign(state.tipGroups.find(x=>x.id===id),o);else state.tipGroups.push({id:tipCode(date),...o});closeModal();commit(id?'ویرایش گروه انعام':'ثبت گروه انعام')}
function viewsPenalties(){return pageHead('جریمه و تشویق','فقط موارد تاییدشده در محاسبه کارکرد ماه اثر دارند.',`<button class="btn btn-primary" onclick="editPenalty()">+ ثبت مورد</button>`)+eventTable('penaltiesRewards',['تاریخ','پرسنل','نوع','مبلغ','شرح','وضعیت','تأییدکننده'],x=>[x.date,personLabel(x.personnelId),x.type,money(x.amount),x.reason||'',badge(x.status),x.approvedBy||'—'],editPenalty,'حذف جریمه/تشویق')}
function editPenalty(id){const x=id?state.penaltiesRewards.find(a=>a.id===id):{date:todayJ(),type:'جریمه',amount:0,status:'پیش‌نویس'};openForm(id?'ویرایش جریمه/تشویق':'ثبت جریمه/تشویق',[{name:'date',label:'تاریخ'},{name:'personnelId',label:'پرسنل',type:'select',options:activePersonnel().map(p=>({value:p.id,label:p.id+' | '+p.name}))},{name:'type',label:'نوع',type:'select',options:state.lists.penaltyRewardTypes},{name:'amount',label:'مبلغ (تومان)',type:'number'},{name:'reason',label:'علت/شرح',type:'textarea',full:true},{name:'status',label:'وضعیت',type:'select',options:state.lists.approvalStatuses},{name:'approvedBy',label:'تأییدکننده'},{name:'notes',label:'توضیحات',type:'textarea',full:true}],x,async o=>{const pr=periodOf(o.date);if(!pr.year||!o.personnelId||n(o.amount)<=0)throw Error('تاریخ، پرسنل و مبلغ الزامی است');o.year=pr.year;o.month=pr.month;if(id)Object.assign(x,o);else state.penaltiesRewards.push({id:uid('PR',state.penaltiesRewards),...o});closeModal();await commit(id?'ویرایش جریمه/تشویق':'ثبت جریمه/تشویق')})}
function calcDelay(x){if(!x.scheduledTime||!x.actualTime)return{minutes:0,hours:0,deduction:0};const toM=t=>{const [h,m]=t.split(':').map(Number);return h*60+m};let min=Math.max(0,toM(x.actualTime)-toM(x.scheduledTime));const p=person(x.personnelId),rate=n(p?.hourlyRate)||n(state.settings.baseHourlyRate),hours=min/60;return{minutes:min,hours,deduction:hours*rate*n(state.settings.delayDeductionFactor)}}
function viewsDelays(){const f=ui.delayReport,items=state.delays.filter(x=>(!f.personnelId||x.personnelId===f.personnelId)&&(!f.from||dateCode(x.date)>=dateCode(f.from))&&(!f.to||dateCode(x.date)<=dateCode(f.to))).sort((a,b)=>dateCode(b.date)-dateCode(a.date)),sum=items.reduce((s,x)=>s+calcDelay(x).hours,0),ded=items.reduce((s,x)=>s+calcDelay(x).deduction,0);return pageHead('ثبت و گزارش تأخیر','تأخیر شروع شیفت و بازگشت از رست؛ کسر ساعت و مبلغ خودکار.',`<button class="btn btn-primary" onclick="editDelay()">+ ثبت تأخیر</button>`)+`<div class="card"><div class="toolbar"><div class="field"><label>پرسنل</label><select onchange="ui.delayReport.personnelId=this.value;renderView()">${personOptions(f.personnelId,true)}</select></div><div class="field"><label>از تاریخ</label><input value="${esc(f.from)}" onchange="ui.delayReport.from=this.value;renderView()"></div><div class="field"><label>تا تاریخ</label><input value="${esc(f.to)}" onchange="ui.delayReport.to=this.value;renderView()"></div></div></div><div class="grid grid-3"><div class="card kpi"><div class="label">تعداد موارد</div><div class="value">${items.length}</div></div><div class="card kpi"><div class="label">ساعت تأخیر</div><div class="value">${dec(sum)}</div></div><div class="card kpi"><div class="label">مبلغ کسر</div><div class="value">${money(ded)}</div></div></div><div class="card"><div class="table-wrap"><table class="data-table"><thead><tr><th>تاریخ</th><th>پرسنل</th><th>نوع</th><th>شیفت</th><th>مقرر</th><th>حضور</th><th>دقیقه</th><th>کسر ساعت</th><th>کسر مبلغ</th><th></th></tr></thead><tbody>${items.map(x=>{const c=calcDelay(x);return `<tr><td>${x.date}</td><td>${personLabel(x.personnelId)}</td><td>${x.type}</td><td>${x.shift}</td><td>${x.scheduledTime}</td><td>${x.actualTime}</td><td>${c.minutes}</td><td>${dec(c.hours)}</td><td>${money(c.deduction)}</td><td><button class="btn btn-sm" onclick="editDelay('${x.id}')">ویرایش</button> <button class="btn btn-danger btn-sm" onclick="removeItem('delays','${x.id}','حذف تأخیر')">حذف</button></td></tr>`}).join('')||'<tr><td colspan="10" class="empty">موردی ثبت نشده است.</td></tr>'}</tbody></table></div></div>`}
function editDelay(id){const x=id?state.delays.find(a=>a.id===id):{date:todayJ(),type:'شروع شیفت',shift:'عصر',scheduledTime:'17:00',actualTime:'17:00'};openForm(id?'ویرایش تأخیر':'ثبت تأخیر',[{name:'date',label:'تاریخ'},{name:'personnelId',label:'پرسنل',type:'select',options:activePersonnel().map(p=>({value:p.id,label:p.id+' | '+p.name}))},{name:'type',label:'نوع تأخیر',type:'select',options:state.lists.delayTypes},{name:'shift',label:'شیفت',type:'select',options:state.lists.shifts},{name:'scheduledTime',label:'ساعت مقرر',type:'time'},{name:'actualTime',label:'ساعت حضور',type:'time'},{name:'notes',label:'توضیحات',type:'textarea',full:true}],x,async o=>{const pr=periodOf(o.date);if(!pr.year||!o.personnelId)throw Error('تاریخ و پرسنل الزامی است');o.year=pr.year;o.month=pr.month;if(id)Object.assign(x,o);else state.delays.push({id:uid('DLY',state.delays),...o});closeModal();await commit(id?'ویرایش تأخیر':'ثبت تأخیر')})}
function eventTable(collection,headers,rowFn,editFn,deleteReason){const arr=[...state[collection]].sort((a,b)=>dateCode(b.date)-dateCode(a.date));return `<div class="card"><div class="table-wrap"><table class="data-table"><thead><tr>${headers.map(x=>`<th>${x}</th>`).join('')}<th></th></tr></thead><tbody>${arr.map(x=>`<tr>${rowFn(x).map(v=>`<td>${v}</td>`).join('')}<td><button class="btn btn-sm" onclick="${editFn.name}('${x.id}')">ویرایش</button> <button class="btn btn-danger btn-sm" onclick="removeItem('${collection}','${x.id}','${deleteReason}')">حذف</button></td></tr>`).join('')||`<tr><td colspan="${headers.length+1}" class="empty">رکوردی ثبت نشده است.</td></tr>`}</tbody></table></div></div>`}

function clearPaymentFilters(){ui.payments={year:'',month:'',personnelId:'',type:'',method:'',from:'',to:''};renderView()}
function filteredPayments(){const f=ui.payments;return state.payments.filter(x=>!['void','ابطال‌شده','لغوشده'].includes(x.status)&&(f.year===''||Number(x.salaryYear)===Number(f.year))&&(f.month===''||Number(x.salaryMonth)===Number(f.month))&&(!f.personnelId||x.personnelId===f.personnelId)&&(!f.type||x.type===f.type)&&(!f.method||x.method===f.method)&&(!f.from||dateCode(x.date)>=dateCode(f.from))&&(!f.to||dateCode(x.date)<=dateCode(f.to))).sort((a,b)=>dateCode(b.date)-dateCode(a.date))}
function exportPaymentsCsv(){const rows=[['تاریخ','سال حقوق','ماه حقوق','کد پرسنلی','نام','نوع','مبلغ','روش','حساب مبدأ','پیگیری','ثبت‌کننده','توضیحات']];filteredPayments().forEach(x=>rows.push([x.date,x.salaryYear,x.salaryMonth,x.personnelId,person(x.personnelId)?.name||'',x.type,x.amount,x.method||'',x.sourceAccount||'',x.tracking||'',x.registeredBy||'',x.notes||'']));downloadCsv('Rayo_Payments_Filtered.csv',rows)}
function removePayment(id){const x=state.payments.find(a=>a.id===id);if(!x)return;if(isPeriodClosed(x.salaryYear,x.salaryMonth))return toast('پرداخت مربوط به ماه قطعی است؛ ابتدا ماه را بازگشایی کنید',true);removeItem('payments',id,'حذف پرداخت حقوق')}

function viewsPayments(){const f=ui.payments,items=filteredPayments(),total=items.reduce((s,x)=>s+n(x.amount),0),adv=items.filter(x=>x.type==='مساعده').reduce((s,x)=>s+n(x.amount),0),salary=total-adv;return pageHead('پرداخت حقوق و مساعده','فیلتر کامل بر اساس ماه حقوق، پرسنل، نوع، روش و بازه تاریخ پرداخت.',`<button class="btn" onclick="exportPaymentsCsv()">خروجی CSV فیلتر</button> <button class="btn btn-primary" onclick="editPayment()">+ ثبت پرداخت</button>`)+`<div class="card"><div class="payment-filters"><div class="field"><label>سال حقوق</label><input type="number" value="${esc(f.year)}" onchange="ui.payments.year=this.value===''?'':+this.value;renderView()"></div><div class="field"><label>ماه حقوق</label><select onchange="ui.payments.month=this.value===''?'':+this.value;renderView()"><option value="">همه ماه‌ها</option>${state.lists.months.map((x,i)=>`<option value="${i+1}" ${Number(f.month)===i+1?'selected':''}>${esc(x)}</option>`).join('')}</select></div><div class="field"><label>پرسنل</label><select onchange="ui.payments.personnelId=this.value;renderView()">${allPersonOptions(f.personnelId,true)}</select></div><div class="field"><label>نوع پرداخت</label><select onchange="ui.payments.type=this.value;renderView()"><option value="">همه انواع</option>${state.lists.paymentTypes.map(x=>`<option ${f.type===x?'selected':''}>${esc(x)}</option>`).join('')}</select></div><div class="field"><label>روش پرداخت</label><select onchange="ui.payments.method=this.value;renderView()"><option value="">همه روش‌ها</option>${state.lists.paymentMethods.map(x=>`<option ${f.method===x?'selected':''}>${esc(x)}</option>`).join('')}</select></div><div class="field"><label>از تاریخ پرداخت</label><input value="${esc(f.from)}" onchange="ui.payments.from=this.value;renderView()"></div><div class="field"><label>تا تاریخ پرداخت</label><input value="${esc(f.to)}" onchange="ui.payments.to=this.value;renderView()"></div><button class="btn" onclick="clearPaymentFilters()">پاک‌کردن فیلترها</button></div></div><div class="grid grid-4"><div class="card kpi"><div class="label">تعداد پرداخت</div><div class="value">${items.length}</div></div><div class="card kpi"><div class="label">جمع کل</div><div class="value">${money(total)}</div></div><div class="card kpi"><div class="label">مساعده</div><div class="value">${money(adv)}</div></div><div class="card kpi"><div class="label">پرداخت حقوق/تسویه</div><div class="value">${money(salary)}</div></div></div><div class="card"><div class="table-wrap"><table class="data-table"><thead><tr><th>تاریخ</th><th>سال/ماه حقوق</th><th>پرسنل</th><th>نوع</th><th>مبلغ</th><th>روش</th><th>حساب مبدأ</th><th>پیگیری</th><th>وضعیت ماه</th><th></th></tr></thead><tbody>${items.map(x=>{const closed=isPeriodClosed(x.salaryYear,x.salaryMonth);return `<tr><td>${esc(x.date)}</td><td>${x.salaryYear}/${x.salaryMonth}</td><td>${esc(personLabel(x.personnelId))}</td><td>${esc(x.type)}</td><td class="num">${money(x.amount)}</td><td>${esc(x.method||'—')}</td><td>${esc(x.sourceAccount||'—')}</td><td>${esc(x.tracking||'—')}</td><td>${closed?'<span class="badge success">قطعی/قفل</span>':'<span class="badge">باز</span>'}</td><td>${closed?'<span class="muted">برای تغییر، ماه را بازگشایی کنید</span>':`<button class="btn btn-sm" onclick="editPayment('${x.id}')">ویرایش</button> <button class="btn btn-danger btn-sm" onclick="removePayment('${x.id}')">حذف</button>`}</td></tr>`}).join('')||'<tr><td colspan="10" class="empty">پرداختی مطابق فیلترها پیدا نشد.</td></tr>'}</tbody></table></div></div>`}
function editPayment(id){const x=id?state.payments.find(a=>a.id===id):{date:todayJ(),salaryYear:ui.payments.year||parseJDate(todayJ()).y,salaryMonth:ui.payments.month||parseJDate(todayJ()).m,type:'مساعده',amount:0,method:'کارت به کارت'};if(id&&isPeriodClosed(x.salaryYear,x.salaryMonth))return toast('پرداخت مربوط به ماه قطعی است؛ ابتدا ماه را بازگشایی کنید',true);openForm(id?'ویرایش پرداخت':'ثبت پرداخت',[{name:'date',label:'تاریخ پرداخت'},{name:'salaryYear',label:'سال حقوق',type:'number'},{name:'salaryMonth',label:'ماه حقوق',type:'select',options:state.lists.months.map((a,i)=>({value:i+1,label:a}))},{name:'personnelId',label:'پرسنل',type:'select',options:activePersonnel().map(p=>({value:p.id,label:p.id+' | '+p.name}))},{name:'type',label:'نوع پرداخت',type:'select',options:state.lists.paymentTypes},{name:'amount',label:'مبلغ (تومان)',type:'number'},{name:'method',label:'روش پرداخت',type:'select',options:state.lists.paymentMethods},{name:'sourceAccount',label:'حساب/کارت مبدأ'},{name:'tracking',label:'شماره پیگیری'},{name:'registeredBy',label:'ثبت‌کننده'},{name:'referenceCode',label:'کد مرجع'},{name:'notes',label:'توضیحات',type:'textarea',full:true}],x,async o=>{if(!o.personnelId||n(o.amount)<=0)throw Error('پرسنل و مبلغ الزامی است');if(isPeriodClosed(o.salaryYear,o.salaryMonth))throw Error('ماه حقوق قطعی است؛ ابتدا آن را بازگشایی کنید');if(id)Object.assign(x,o);else state.payments.push({id:uid('PAY',state.payments),...o});closeModal();await commit(id?'ویرایش پرداخت':'ثبت پرداخت')})}
function viewsConsumption(){return pageHead('مصرف پرسنلی','ثبت اعتبار مصرفی و غذای پرسنلی؛ مانده خودکار در حقوق محاسبه می‌شود.',`<button class="btn btn-primary" onclick="editConsumption()">+ ثبت مصرف</button>`)+eventTable('consumptions',['تاریخ','پرسنل','نوع','مبلغ','توضیحات'],x=>[x.date,personLabel(x.personnelId),x.type,money(x.amount),x.notes||''],editConsumption,'حذف مصرف پرسنلی')}
function editConsumption(id){const x=id?state.consumptions.find(a=>a.id===id):{date:todayJ(),type:'اعتبار',amount:0};openForm(id?'ویرایش مصرف':'ثبت مصرف پرسنلی',[{name:'date',label:'تاریخ'},{name:'personnelId',label:'پرسنل',type:'select',options:activePersonnel().map(p=>({value:p.id,label:p.id+' | '+p.name}))},{name:'type',label:'نوع مصرف',type:'select',options:state.lists.consumptionTypes},{name:'amount',label:'مبلغ (تومان)',type:'number'},{name:'notes',label:'توضیحات',type:'textarea',full:true}],x,async o=>{const pr=periodOf(o.date);if(!pr.year||!o.personnelId||n(o.amount)<=0)throw Error('تاریخ، پرسنل و مبلغ الزامی است');o.year=pr.year;o.month=pr.month;if(id)Object.assign(x,o);else state.consumptions.push({id:uid('CON',state.consumptions),...o});closeModal();await commit(id?'ویرایش مصرف پرسنلی':'ثبت مصرف پرسنلی')})}
function viewsLeaves(){return pageHead('مرخصی و غیبت','ثبت بازه مرخصی، مریضی یا غیبت و تعداد روز/شیفت.',`<button class="btn btn-primary" onclick="editLeave()">+ ثبت مرخصی/غیبت</button>`)+eventTable('leaves',['از تاریخ','تا تاریخ','پرسنل','نوع','تعداد روز/شیفت','توضیحات'],x=>[x.fromDate,x.toDate,personLabel(x.personnelId),x.type,x.count||'—',x.notes||''],editLeave,'حذف مرخصی/غیبت')}
function editLeave(id){const x=id?state.leaves.find(a=>a.id===id):{fromDate:todayJ(),toDate:todayJ(),type:'مرخصی استحقاقی',count:1};openForm(id?'ویرایش مرخصی/غیبت':'ثبت مرخصی/غیبت',[{name:'personnelId',label:'پرسنل',type:'select',options:activePersonnel().map(p=>({value:p.id,label:p.id+' | '+p.name}))},{name:'type',label:'نوع',type:'select',options:state.lists.leaveTypes},{name:'fromDate',label:'از تاریخ'},{name:'toDate',label:'تا تاریخ'},{name:'count',label:'تعداد روز/شیفت',type:'number'},{name:'notes',label:'توضیحات',type:'textarea',full:true}],x,async o=>{if(!o.personnelId||!parseJDate(o.fromDate)||!parseJDate(o.toDate))throw Error('پرسنل و تاریخ معتبر الزامی است');if(id)Object.assign(x,o);else state.leaves.push({id:uid('LEV',state.leaves),...o});closeModal();await commit(id?'ویرایش مرخصی/غیبت':'ثبت مرخصی/غیبت')})}
function effectiveSettled(g){const linked=state.payments.filter(p=>p.tipSettlement&&!['void','ابطال‌شده','لغوشده'].includes(p.status)).flatMap(p=>Array.isArray(p.tipAllocations)?p.tipAllocations:[]).filter(a=>a.tipGroupId===g.id);return linked.length?linked.reduce((sum,a)=>sum+n(a.paidAmount),0):(g.status==='تسویه‌شده'&&n(g.settledAmount)===0?n(g.totalAmount):n(g.settledAmount))}
function monthMetrics(year,month){const rows=payrollRowsForPeriod(year,month),received=state.tipGroups.filter(g=>{const q=periodOf(g.receiveDate);return q.year===year&&q.month===month&&g.status!=='ابطال‌شده'}).reduce((s,x)=>s+n(x.totalAmount),0),linkedSettled=state.payments.filter(p=>p.tipSettlement&&!['void','ابطال‌شده','لغوشده'].includes(p.status)).filter(p=>{const q=periodOf(p.date);return q.year===year&&q.month===month}).reduce((s,p)=>s+n(p.amount),0),legacySettled=state.tipGroups.filter(g=>!state.payments.some(p=>p.tipSettlement&&Array.isArray(p.tipAllocations)&&p.tipAllocations.some(a=>a.tipGroupId===g.id))).filter(g=>{const q=periodOf(g.settlementDate);return q.year===year&&q.month===month}).reduce((s,x)=>s+effectiveSettled(x),0),settled=linkedSettled+legacySettled;return{received,settled,tipBalance:received-state.tipGroups.filter(g=>{const q=periodOf(g.receiveDate);return q.year===year&&q.month===month}).reduce((s,x)=>s+effectiveSettled(x),0),net:rows.reduce((s,x)=>s+x.netToman,0),advance:rows.reduce((s,x)=>s+x.advance,0),paid:rows.reduce((s,x)=>s+x.paid,0),unpaid:rows.reduce((s,x)=>s+x.unpaid,0)}}
function viewsReports(){const y=ui.reports.year,m=ui.reports.month,sel=monthMetrics(y,m),rows=Array.from({length:12},(_,i)=>({month:i+1,...monthMetrics(y,i+1)}));return pageHead('گزارشات مدیریتی','مقایسه ماهانه انعام دریافت و تسویه، حقوق خالص و مانده قابل پرداخت.')+`<div class="card"><div class="toolbar"><div class="field"><label>سال گزارش</label><input type="number" value="${y}" onchange="ui.reports.year=+this.value;renderView()"></div><div class="field"><label>ماه منتخب</label><select onchange="ui.reports.month=+this.value;renderView()">${state.lists.months.map((x,i)=>`<option value="${i+1}" ${i+1===m?'selected':''}>${x}</option>`).join('')}</select></div></div></div><div class="grid grid-4"><div class="card kpi"><div class="label">انعام دریافت‌شده</div><div class="value">${money(sel.received)}</div></div><div class="card kpi"><div class="label">انعام تسویه‌شده</div><div class="value">${money(sel.settled)}</div></div><div class="card kpi"><div class="label">حقوق خالص پیش‌بینی</div><div class="value">${money(sel.net)}</div></div><div class="card kpi"><div class="label">مانده قابل پرداخت</div><div class="value">${money(sel.unpaid)}</div></div></div><div class="grid grid-2"><div class="card"><h2>انعام ماهانه</h2><canvas class="chart" id="tipChart"></canvas></div><div class="card"><h2>حقوق و مانده پرداخت</h2><canvas class="chart" id="payChart"></canvas></div></div><div class="card"><div class="table-wrap"><table class="data-table"><thead><tr><th>ماه</th><th>انعام دریافت</th><th>انعام تسویه</th><th>مانده انعام</th><th>حقوق خالص</th><th>مساعده</th><th>پرداختی</th><th>مانده حقوق</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${monthName(r.month)}</td><td>${money(r.received)}</td><td>${money(r.settled)}</td><td>${money(r.tipBalance)}</td><td>${money(r.net)}</td><td>${money(r.advance)}</td><td>${money(r.paid)}</td><td>${money(r.unpaid)}</td></tr>`).join('')}</tbody></table></div></div>`}
function drawBars(id,series,attempt=0){const c=$(id);if(!c)return;const w=c.clientWidth,h=c.clientHeight;if((w<120||h<80)&&attempt<8){requestAnimationFrame(()=>drawBars(id,series,attempt+1));return}const dpr=devicePixelRatio||1;c.width=w*dpr;c.height=h*dpr;const x=c.getContext('2d');x.setTransform(dpr,0,0,dpr,0,0);x.clearRect(0,0,w,h);const pad=36,max=Math.max(1,...series.flatMap(s=>s.values));x.strokeStyle='#d0d5dd';x.beginPath();x.moveTo(pad,10);x.lineTo(pad,h-pad);x.lineTo(w-10,h-pad);x.stroke();const group=(w-pad-20)/12,bar=Math.max(3,group/(series.length+1));series.forEach((s,si)=>{x.fillStyle=s.color;s.values.forEach((v,i)=>{const bh=(h-pad-20)*v/max;x.fillRect(pad+i*group+si*bar+4,h-pad-bh,bar-2,bh)})});x.fillStyle='#667085';x.font='10px Tahoma';for(let i=0;i<12;i++)x.fillText(String(i+1),pad+i*group+group/3,h-12);let ly=14;series.forEach(s=>{x.fillStyle=s.color;x.fillRect(w-140,ly-9,10,10);x.fillStyle='#344054';x.fillText(s.name,w-125,ly);ly+=16})}
function drawReportsCharts(){const y=ui.reports.year,rs=Array.from({length:12},(_,i)=>monthMetrics(y,i+1));drawBars('tipChart',[{name:'دریافت',color:'#0f766e',values:rs.map(x=>x.received)},{name:'تسویه',color:'#f59e0b',values:rs.map(x=>x.settled)}]);drawBars('payChart',[{name:'حقوق خالص',color:'#155eef',values:rs.map(x=>x.net)},{name:'مانده',color:'#d92d20',values:rs.map(x=>x.unpaid)}])}
function drawDashboardChart(){const t=parseJDate(todayJ()),rs=Array.from({length:12},(_,i)=>monthMetrics(t.y,i+1));drawBars('dashboardChart',[{name:'حقوق خالص',color:'#0f766e',values:rs.map(x=>x.net)},{name:'مانده پرداخت',color:'#f04438',values:rs.map(x=>x.unpaid)}])}

const SALARY_SCHEDULE_KEYS=['weekdayMorning','weekdayEvening','thursdayMorning','thursdayEvening','fridayMorning','fridayEvening','fullWeekday','fullThursday','fullFriday'];
function salaryRound(v){const step=Math.max(1,n(state.salaryModel.roundingStep)||500);return Math.round(n(v)/step)*step}
function salaryLegalHourly(){const s=state.salaryModel,den=n(s.standardWeeklyHours)*n(s.weeksPerMonth);return den>0?salaryRound(n(s.laborMonthlyBase)/den):0}
function salaryScheduleHours(sc){const h=state.salaryModel.workHours,weekly=SALARY_SCHEDULE_KEYS.reduce((sum,k)=>sum+n(sc?.[k])*n(h[k]),0),days=SALARY_SCHEDULE_KEYS.reduce((sum,k)=>sum+n(sc?.[k]),0),night=n(sc?.weekdayEvening)+n(sc?.thursdayEvening)+n(sc?.fridayEvening)+n(sc?.fullWeekday)+n(sc?.fullThursday)+n(sc?.fullFriday);return{weeklyHours:weekly,monthlyHours:weekly*n(state.salaryModel.weeksPerMonth),monthlyDays:days*n(state.salaryModel.weeksPerMonth),nightTrips:night*n(state.salaryModel.weeksPerMonth)}}
function salaryCompute(d){const base=salaryLegalHourly(),pc=n(state.salaryModel.positionCoefficients[d.position])||1,gc=n(state.salaryModel.gradeCoefficients[d.grade])||1,points=Math.floor(n(d.experienceMonths)/6),ef=1+points*n(state.salaryModel.experienceStepPercent)/100,totalFactor=pc*gc*ef,hourly=salaryRound(base*totalFactor),sh=salaryScheduleHours(d.schedule),baseMonthly=salaryRound(hourly*sh.monthlyHours),returnMonthly=salaryRound(sh.nightTrips*n(d.returnAid)),incentive=salaryRound(d.incentive),totalMonthly=salaryRound(baseMonthly+returnMonthly+incentive),contractHourly=sh.monthlyHours>0?salaryRound(n(d.contractMonthly)/sh.monthlyHours):0;return{base,pc,gc,points,ef,totalFactor,hourly,...sh,baseMonthly,returnMonthly,incentive,totalMonthly,contractHourly,gap:contractHourly-hourly}}
function salaryProfileOf(p){return{personnelId:p?.id||'',position:p?.salaryProfile?.position||p?.mainPosition||state.lists.positions[0]||'',grade:p?.salaryProfile?.grade||p?.gradeId||'D',experienceMonths:n(p?.salaryProfile?.experienceMonths??p?.experienceMonths),schedule:{weekdayMorning:0,weekdayEvening:0,thursdayMorning:0,thursdayEvening:0,fridayMorning:0,fridayEvening:0,fullWeekday:0,fullThursday:0,fullFriday:0,...(p?.salaryProfile?.schedule||{})},returnAid:n(p?.salaryProfile?.returnAid),incentive:n(p?.salaryProfile?.incentive),contractMonthly:n(p?.salaryProfile?.contractMonthly)}}
function salarySelectPersonnel(id){const p=person(id);state.salaryModel.draft={...state.salaryModel.draft,...salaryProfileOf(p)};saveData(false);renderView()}
function salaryScheduleBox(title,prefix,keys,schedule,handler){const px=prefix||'',src=schedule||state.salaryModel.draft.schedule,fn=handler||'salaryCalcChanged()';return `<div class="salary-daybox"><h3>${title}</h3><div class="salary-mini-grid">${keys.map(([k,l])=>`<div class="field"><label>${l}</label><input type="number" min="0" step="0.5" id="sal_${px}${k}" value="${n(src?.[k])}" oninput="${fn}"></div>`).join('')}</div></div>`}
function salaryCalcRead(){const d=state.salaryModel.draft;d.personnelId=$('sal_personnel')?.value||'';d.position=$('sal_position')?.value||'';d.grade=$('sal_grade')?.value||'D';d.experienceMonths=n($('sal_experience')?.value);d.returnAid=n($('sal_returnAid')?.value);d.incentive=n($('sal_incentive')?.value);d.contractMonthly=n($('sal_contract')?.value);d.schedule=Object.fromEntries(SALARY_SCHEDULE_KEYS.map(k=>[k,n($('sal_'+k)?.value)]));return d}
function salaryCalcChanged(){const d=salaryCalcRead(),r=salaryCompute(d);const set=(id,v)=>{const e=$(id);if(e)e.textContent=v};set('sal_hourly',money(r.hourly));set('sal_total',money(r.totalMonthly));set('sal_baseMonthly',money(r.baseMonthly));set('sal_returnMonthly',money(r.returnMonthly));set('sal_monthlyHours',dec(r.monthlyHours,2)+' ساعت');set('sal_weeklyHours',dec(r.weeklyHours,2)+' ساعت');set('sal_factor',dec(r.pc,3)+' × '+dec(r.gc,3)+' × '+dec(r.ef,3));set('sal_legal',money(r.base));set('sal_contractHourly',r.contractHourly?money(r.contractHourly):'—');set('sal_gap',r.contractHourly?money(r.gap):'—');set('sal_formula',`${money(r.base)} × ${dec(r.pc,3)} × ${dec(r.gc,3)} × ${dec(r.ef,3)} = ${money(r.hourly)}\n${dec(r.monthlyHours,2)} ساعت × ${money(r.hourly)} + رفت‌وآمد + کارانه = ${money(r.totalMonthly)}`);saveData(false)}
function salaryCalcAfterRender(){salaryCalcChanged();salaryQuickChanged();if(state.salaryModel.draft.reverseMode==='monthly')salaryReverseChanged();else salaryCoefficientPreview()}
async function salarySaveProfile(applyRate=false){const d=salaryCalcRead(),p=person(d.personnelId);if(!p)return toast('ابتدا پرسنل را انتخاب کنید',true);p.mainPosition=d.position;p.gradeId=d.grade;p.experienceMonths=d.experienceMonths;p.salaryProfile={position:d.position,grade:d.grade,experienceMonths:d.experienceMonths,schedule:{...d.schedule},returnAid:d.returnAid,incentive:d.incentive,contractMonthly:d.contractMonthly,updatedAt:new Date().toISOString()};if(applyRate)p.hourlyRate=salaryCompute(d).hourly;await commit(applyRate?'ذخیره مدل و اعمال نرخ ساعتی به پرسنل':'ذخیره پروفایل محاسبه حقوق پرسنل');toast(applyRate?'نرخ پیشنهادی در پرونده پرسنل ثبت شد':'پروفایل محاسبه حقوق ذخیره شد')}
function salaryQuickChanged(){const d=state.salaryModel.draft,mode=$('sal_quickMode')?.value||d.quickMode;d.quickMode=mode;d.quickMonthlyHours=n($('sal_quickHours')?.value);if(mode==='hourly'){d.quickHourlyRate=salaryRound(n($('sal_quickHourly')?.value));d.quickMonthlySalary=salaryRound(d.quickHourlyRate*d.quickMonthlyHours)}else{d.quickMonthlySalary=salaryRound(n($('sal_quickMonthly')?.value));d.quickHourlyRate=d.quickMonthlyHours?salaryRound(d.quickMonthlySalary/d.quickMonthlyHours):0}if($('sal_quickHourly'))$('sal_quickHourly').value=d.quickHourlyRate;if($('sal_quickMonthly'))$('sal_quickMonthly').value=d.quickMonthlySalary;const e=$('sal_quickResult');if(e)e.textContent=`ساعتی ${money(d.quickHourlyRate)} — ماهانه ${money(d.quickMonthlySalary)}`;saveData(false)}
function salarySetReverseMode(mode){state.salaryModel.draft.reverseMode=mode==='coefficients'?'coefficients':'monthly';saveData(false);renderView()}
function salaryReverseRead(){const d=state.salaryModel.draft;d.reverseFinalMonthly=n($('sal_revContract')?.value||d.reverseFinalMonthly);d.reversePosition=$('sal_revPosition')?.value||d.reversePosition;d.reverseGrade=$('sal_revGrade')?.value||d.reverseGrade;d.reverseExperienceMonths=n($('sal_revExperience')?.value||d.reverseExperienceMonths);d.reverseSchedule=Object.fromEntries(SALARY_SCHEDULE_KEYS.map(k=>[k,n($('sal_rev_'+k)?.value)]));return d}
function salaryReverseChanged(){const d=salaryReverseRead(),r=salaryCompute({position:d.reversePosition,grade:d.reverseGrade,experienceMonths:d.reverseExperienceMonths,schedule:d.reverseSchedule,returnAid:0,incentive:0,contractMonthly:d.reverseFinalMonthly}),set=(id,v)=>{const e=$(id);if(e)e.textContent=v};set('sal_revHourly',r.contractHourly?money(r.contractHourly):'—');set('sal_revHours',r.monthlyHours?dec(r.monthlyHours,2)+' ساعت':'—');set('sal_revModel',r.hourly?money(r.hourly):'—');set('sal_revGap',r.contractHourly?money(r.gap):'—');set('sal_revFactor',r.contractHourly&&r.base?dec(r.contractHourly/r.base,3):'—');const note=$('sal_revNotice');if(note){if(!d.reverseFinalMonthly)note.textContent='مبلغ قرارداد ماهانه را وارد کنید.';else if(!r.monthlyHours)note.textContent='برای تحلیل معکوس، برنامه کاری قرارداد را وارد کنید.';else note.textContent=`${money(d.reverseFinalMonthly)} ÷ ${dec(r.monthlyHours,2)} ساعت = ${money(r.contractHourly)} در ساعت؛ اختلاف با مدل ${money(r.gap)} است.`}saveData(false)}
function salarySaveModelSettings(){const s=state.salaryModel;s.laborMonthlyBase=n($('salm_labor').value);s.standardWeeklyHours=n($('salm_standard').value)||44;s.weeksPerMonth=n($('salm_weeks').value)||4.333;s.experienceStepPercent=n($('salm_expstep').value);s.roundingStep=n($('salm_round').value)||500;SALARY_SCHEDULE_KEYS.forEach(k=>s.workHours[k]=n($('salm_h_'+k).value));qsa('[data-salary-position]').forEach(e=>s.positionCoefficients[e.dataset.salaryPosition]=n(e.value)||1);qsa('[data-salary-grade]').forEach(e=>s.gradeCoefficients[e.dataset.salaryGrade]=n(e.value)||1);state.settings.weeksPerMonth=s.weeksPerMonth;state.settings.baseHourlyRate=salaryLegalHourly();commit('ویرایش تنظیمات مدل حقوق')}
function salaryCoefficientPreview(){const d=state.salaryModel.draft;d.targetHourly=n($('sal_targetHourly')?.value||d.targetHourly);d.targetPosition=$('sal_targetPosition')?.value||d.targetPosition;d.targetGrade=$('sal_targetGrade')?.value||d.targetGrade;d.targetExperienceMonths=n($('sal_targetExperience')?.value||d.targetExperienceMonths);d.gradeShare=Math.min(100,Math.max(0,n($('sal_gradeShare')?.value||d.gradeShare)));const base=salaryLegalHourly(),pc=n(state.salaryModel.positionCoefficients[d.targetPosition])||1,points=Math.floor(d.targetExperienceMonths/6),rank={D:0,C:1,B:2,A:3}[d.targetGrade]||0,total=base*pc>0?d.targetHourly/(base*pc):0,gradeTarget=total>0?Math.pow(total,d.gradeShare/100):1,expTarget=gradeTarget?total/gradeTarget:1,gradeStep=rank>0?(gradeTarget-1)/rank:0,expPct=points>0?(expTarget-1)/points*100:0,expFactor=1+points*expPct/100,rebuilt=salaryRound(base*pc*(1+rank*gradeStep)*expFactor),valid=base>0&&d.targetHourly>0&&(rank>0||points>0);d._proposal={rank,total,gradeStep,expPct,rebuilt,valid};const e=$('sal_coefResult');if(e)e.innerHTML=`ضریب کل لازم: <b>${dec(total,4)}</b> — افزایش هر ۶ ماه: <b>${dec(expPct,3)}٪</b> — نرخ بازسازی‌شده: <b>${money(rebuilt)}</b>`;const body=$('sal_coefTableBody');if(body)body.innerHTML=['D','C','B','A'].map((g,i)=>{const gc=rank===0?1:1+gradeStep*i;return `<tr><td><b>${g}</b></td><td>${dec(gc,4)}</td><td>${money(base*pc*gc)}</td><td>${money(base*pc*gc*expFactor)}</td></tr>`}).join('');saveData(false)}
function salaryApplyCoefficientProposal(){salaryCoefficientPreview();const p=state.salaryModel.draft._proposal;if(!p?.valid)return toast('پارامترهای پیشنهاد ضرایب معتبر نیست',true);const targetGrade=state.salaryModel.draft.targetGrade,rank={D:0,C:1,B:2,A:3}[targetGrade]||0;['D','C','B','A'].forEach((g,i)=>state.salaryModel.gradeCoefficients[g]=rank===0?1:1+p.gradeStep*i);state.salaryModel.experienceStepPercent=p.expPct;commit('اعمال پیشنهاد ضرایب مدل حقوق')}
function salaryRateRows(){const d=state.salaryModel.draft,max=Math.max(0,Math.floor(n(d.rateMaxMonths)/6)*6),ps=state.lists.positions.filter(x=>!d.ratePosition||x===d.ratePosition),gs=['A','B','C','D'].filter(x=>!d.rateGrade||x===d.rateGrade),rows=[];ps.forEach(position=>gs.forEach(grade=>{for(let m=0;m<=max;m+=6){const r=salaryCompute({position,grade,experienceMonths:m,schedule:{},returnAid:0,incentive:0,contractMonthly:0});rows.push({position,grade,months:m,points:Math.floor(m/6),pc:r.pc,gc:r.gc,ef:r.ef,hourly:r.hourly})}}));return rows}
function salaryRateFilterChanged(){state.salaryModel.draft.ratePosition=$('sal_ratePosition').value;state.salaryModel.draft.rateGrade=$('sal_rateGrade').value;state.salaryModel.draft.rateMaxMonths=n($('sal_rateMax').value);saveData(false);renderView()}
function salaryExportRatesCsv(){const rows=[['پوزیشن','گرید','سابقه ماه','امتیاز','ضریب پوزیشن','ضریب گرید','ضریب سابقه','حقوق ساعتی']];salaryRateRows().forEach(x=>rows.push([x.position,x.grade,x.months,x.points,x.pc,x.gc,x.ef,x.hourly]));downloadCsv('Rayo_Hourly_Rates.csv',rows)}
function salaryPersonnelFilterChanged(){ui.salaryPersonnelSearch=$('salp_search')?.value||'';ui.salaryPersonnelPosition=$('salp_position')?.value||'';ui.salaryPersonnelStatus=$('salp_status')?.value||'';renderView()}
function salaryOpenPersonnel(id){const p=person(id);if(!p)return;state.salaryModel.draft={...state.salaryModel.draft,...salaryProfileOf(p)};saveData(false);const b=qs('.nav-btn[data-view="salaryCalculator"]');if(b)b.click()}
function salaryPersonnelRows(){const q=normalizeDigits(ui.salaryPersonnelSearch).toLowerCase().trim();return state.personnel.filter(p=>(!q||normalizeDigits(`${p.id} ${p.name} ${p.phone||''}`).toLowerCase().includes(q))&&(!ui.salaryPersonnelPosition||p.mainPosition===ui.salaryPersonnelPosition)&&(!ui.salaryPersonnelStatus||p.status===ui.salaryPersonnelStatus))}
function salaryExportPersonnelCsv(){const rows=[['کد','نام','پوزیشن','گرید','سابقه ماه','ساعت ماهانه','نرخ ساعتی مدل','دستمزد پایه','برگشت','کارانه','جمع تخمینی']];salaryPersonnelRows().forEach(p=>{const r=salaryCompute(salaryProfileOf(p));rows.push([p.id,p.name,p.mainPosition,p.gradeId||'D',p.experienceMonths||0,r.monthlyHours,r.hourly,r.baseMonthly,r.returnMonthly,r.incentive,r.totalMonthly])});downloadCsv('Rayo_Salary_Personnel.csv',rows)}
function salaryOpenEstimatePayslip(id){const p=person(id);if(!p)return;const r=salaryCompute(salaryProfileOf(p));$('modalTitle').textContent='فیش تخمینی حقوق';$('modalBody').innerHTML=`<div class="payslip"><h2>فیش تخمینی رایو</h2><p style="text-align:center">${esc(p.id+' | '+p.name)}</p><div class="payslip-grid"><div>پوزیشن / گرید</div><div>${esc(p.mainPosition||'—')} / ${esc(p.gradeId||'D')}</div><div>ساعت ماهانه</div><div>${dec(r.monthlyHours,2)}</div><div>نرخ ساعتی مدل</div><div>${money(r.hourly)}</div><div>دستمزد پایه</div><div>${money(r.baseMonthly)}</div><div>کمک‌هزینه برگشت</div><div>${money(r.returnMonthly)}</div><div>کارانه</div><div>${money(r.incentive)}</div><div>جمع تخمینی</div><div><b>${money(r.totalMonthly)}</b></div></div><div class="hint">این فیش تخمینی است و کسورات واقعی، جریمه، مساعده، انعام و پرداخت‌های ماه در آن نیست.</div></div>`;$('modalFoot').innerHTML=`<button class="btn" onclick="closeModal()">بستن</button>`;$('modalBackdrop').classList.add('open')}
function salaryAddPosition(){const name=$('salm_newPosition')?.value.trim(),coef=n($('salm_newPositionCoef')?.value)||1;if(!name)return toast('نام پوزیشن را وارد کنید',true);if(state.lists.positions.includes(name))return toast('این پوزیشن قبلاً وجود دارد',true);state.lists.positions.push(name);state.salaryModel.positionCoefficients[name]=coef;commit('افزودن پوزیشن به مدل حقوق')}
function salaryDeletePosition(encoded){const name=decodeURIComponent(encoded);if(state.personnel.some(p=>p.mainPosition===name||p.backupPosition===name||p.salaryProfile?.position===name))return toast('این پوزیشن در پرونده پرسنل استفاده شده است',true);state.lists.positions=state.lists.positions.filter(x=>x!==name);delete state.salaryModel.positionCoefficients[name];commit('حذف پوزیشن از مدل حقوق')}
function viewsSalaryCalculator(){let d=state.salaryModel.draft;if(!d.personnelId&&activePersonnel()[0])Object.assign(d,salaryProfileOf(activePersonnel()[0]));const r=salaryCompute(d),rev=d.reverseSchedule||{},mode=d.reverseMode||'monthly';return pageHead('محاسبه‌گر حقوق','مدل حقوق، تحلیل معکوس، محاسبه سریع و پروفایل پرسنل روی همان JSON مشترک کار می‌کنند.',`<button class="btn btn-success" onclick="salarySaveProfile(false)">ذخیره پروفایل پرسنل</button><button class="btn btn-primary" onclick="salarySaveProfile(true)">اعمال نرخ پیشنهادی</button>`)+`
<div class="success-box">اطلاعات پرسنل فقط در آرایه <code>personnel</code> نگهداری می‌شود. این صفحه فقط پروفایل حقوق همان رکورد را ویرایش می‌کند.</div>
<div class="grid grid-2" style="margin-top:16px"><div>
<div class="card salary-section"><div class="section-head"><h2>پرسنل و پارامترهای قرارداد</h2></div><div class="form-grid">
<div class="field full"><label>انتخاب پرسنل مشترک</label><select id="sal_personnel" onchange="salarySelectPersonnel(this.value)">${personOptions(d.personnelId)}</select></div>
<div class="field"><label>پوزیشن</label><select id="sal_position" onchange="salaryCalcChanged()">${state.lists.positions.map(x=>`<option ${x===d.position?'selected':''}>${esc(x)}</option>`).join('')}</select></div>
<div class="field"><label>گرید</label><select id="sal_grade" onchange="salaryCalcChanged()">${['A','B','C','D'].map(x=>`<option ${x===d.grade?'selected':''}>${x}</option>`).join('')}</select></div>
<div class="field"><label>سابقه قابل محاسبه (ماه)</label><input id="sal_experience" type="number" value="${n(d.experienceMonths)}" oninput="salaryCalcChanged()"></div>
<div class="field"><label>مبلغ قرارداد ماهانه (تومان)</label><input id="sal_contract" type="number" value="${n(d.contractMonthly)}" oninput="salaryCalcChanged()"></div>
<div class="field"><label>کمک‌هزینه برگشت هر شب</label><input id="sal_returnAid" type="number" value="${n(d.returnAid)}" oninput="salaryCalcChanged()"></div>
<div class="field"><label>کارانه/مبلغ ثابت ماهانه (تومان)</label><input id="sal_incentive" type="number" value="${n(d.incentive)}" oninput="salaryCalcChanged()"></div></div></div>
<div class="card salary-section"><div class="section-head"><h2>برنامه کاری هفتگی</h2></div><div class="salary-schedule">${salaryScheduleBox('روزهای عادی','',[['weekdayMorning','صبح'],['weekdayEvening','عصر'],['fullWeekday','روز کامل']],d.schedule)}${salaryScheduleBox('پنجشنبه','',[['thursdayMorning','صبح'],['thursdayEvening','عصر'],['fullThursday','روز کامل']],d.schedule)}${salaryScheduleBox('جمعه','',[['fridayMorning','صبح'],['fridayEvening','عصر'],['fullFriday','روز کامل']],d.schedule)}</div></div>
<div class="card salary-section"><div class="section-head"><h2>محاسبه‌گر ساده ساعتی و ماهانه</h2></div><div class="form-grid"><div class="field"><label>نوع ورودی</label><select id="sal_quickMode" onchange="salaryQuickChanged()"><option value="hourly" ${d.quickMode==='hourly'?'selected':''}>حقوق ساعتی</option><option value="monthly" ${d.quickMode==='monthly'?'selected':''}>حقوق ماهانه</option></select></div><div class="field"><label>ساعت ماهانه</label><input id="sal_quickHours" type="number" value="${n(d.quickMonthlyHours)}" oninput="salaryQuickChanged()"></div><div class="field"><label>حقوق ساعتی</label><input id="sal_quickHourly" type="number" value="${n(d.quickHourlyRate)}" oninput="salaryQuickChanged()"></div><div class="field"><label>حقوق ماهانه</label><input id="sal_quickMonthly" type="number" value="${n(d.quickMonthlySalary)}" oninput="salaryQuickChanged()"></div></div><div class="salary-note" id="sal_quickResult"></div></div>
</div><aside>
<div class="card"><div class="salary-hero"><small>نرخ پیشنهادی هر ساعت</small><strong id="sal_hourly">${money(r.hourly)}</strong><div class="salary-sub">جمع دریافتی تخمینی: <b id="sal_total">${money(r.totalMonthly)}</b></div></div><div class="salary-metrics" style="margin-top:12px"><div class="salary-metric"><span>دستمزد پایه ماهانه</span><strong id="sal_baseMonthly">${money(r.baseMonthly)}</strong></div><div class="salary-metric"><span>کمک‌هزینه برگشت</span><strong id="sal_returnMonthly">${money(r.returnMonthly)}</strong></div><div class="salary-metric"><span>ساعت هفتگی</span><strong id="sal_weeklyHours">${dec(r.weeklyHours,2)} ساعت</strong></div><div class="salary-metric"><span>ساعت ماهانه</span><strong id="sal_monthlyHours">${dec(r.monthlyHours,2)} ساعت</strong></div><div class="salary-metric"><span>نرخ پایه ساعتی</span><strong id="sal_legal">${money(r.base)}</strong></div><div class="salary-metric"><span>ضرایب</span><strong id="sal_factor">${dec(r.pc,3)} × ${dec(r.gc,3)} × ${dec(r.ef,3)}</strong></div><div class="salary-metric"><span>نرخ قرارداد</span><strong id="sal_contractHourly">${r.contractHourly?money(r.contractHourly):'—'}</strong></div><div class="salary-metric"><span>اختلاف قرارداد و مدل</span><strong id="sal_gap">${r.contractHourly?money(r.gap):'—'}</strong></div></div><div class="salary-note" id="sal_formula" style="margin-top:12px"></div></div>
<div class="card"><div class="section-head"><h2>تحلیل معکوس حقوق و ضرایب</h2></div><div class="salary-segmented"><button class="${mode==='monthly'?'active':''}" onclick="salarySetReverseMode('monthly')">قرارداد ماهانه به ساعتی</button><button class="${mode==='coefficients'?'active':''}" onclick="salarySetReverseMode('coefficients')">پیشنهاد ضرایب</button></div>${mode==='monthly'?`
<div class="form-grid"><div class="field full"><label>مبلغ ماهانه قرارداد (تومان)</label><input id="sal_revContract" type="number" value="${n(d.reverseFinalMonthly)}" oninput="salaryReverseChanged()"></div><div class="field"><label>پوزیشن</label><select id="sal_revPosition" onchange="salaryReverseChanged()">${state.lists.positions.map(x=>`<option ${x===d.reversePosition?'selected':''}>${esc(x)}</option>`).join('')}</select></div><div class="field"><label>گرید</label><select id="sal_revGrade" onchange="salaryReverseChanged()">${['A','B','C','D'].map(x=>`<option ${x===d.reverseGrade?'selected':''}>${x}</option>`).join('')}</select></div><div class="field"><label>سابقه (ماه)</label><input id="sal_revExperience" type="number" value="${n(d.reverseExperienceMonths)}" oninput="salaryReverseChanged()"></div></div><h3>برنامه کاری قرارداد</h3><div class="salary-schedule">${salaryScheduleBox('روزهای عادی','rev_',[['weekdayMorning','صبح'],['weekdayEvening','عصر'],['fullWeekday','روز کامل']],rev,'salaryReverseChanged()')}${salaryScheduleBox('پنجشنبه','rev_',[['thursdayMorning','صبح'],['thursdayEvening','عصر'],['fullThursday','روز کامل']],rev,'salaryReverseChanged()')}${salaryScheduleBox('جمعه','rev_',[['fridayMorning','صبح'],['fridayEvening','عصر'],['fullFriday','روز کامل']],rev,'salaryReverseChanged()')}</div><div class="salary-metrics" style="margin-top:12px"><div class="salary-metric"><span>نرخ ساعتی قرارداد</span><strong id="sal_revHourly">—</strong></div><div class="salary-metric"><span>ساعت ماهانه</span><strong id="sal_revHours">—</strong></div><div class="salary-metric"><span>نرخ پیشنهادی مدل</span><strong id="sal_revModel">—</strong></div><div class="salary-metric"><span>اختلاف ساعتی</span><strong id="sal_revGap">—</strong></div><div class="salary-metric"><span>ضریب واقعی نسبت به پایه</span><strong id="sal_revFactor">—</strong></div></div><div class="salary-note" id="sal_revNotice" style="margin-top:12px"></div>`:`
<div class="form-grid"><div class="field"><label>حقوق ساعتی هدف</label><input id="sal_targetHourly" type="number" value="${n(d.targetHourly)}" oninput="salaryCoefficientPreview()"></div><div class="field"><label>پوزیشن هدف</label><select id="sal_targetPosition" onchange="salaryCoefficientPreview()">${state.lists.positions.map(x=>`<option ${x===d.targetPosition?'selected':''}>${esc(x)}</option>`).join('')}</select></div><div class="field"><label>گرید هدف</label><select id="sal_targetGrade" onchange="salaryCoefficientPreview()">${['A','B','C','D'].map(x=>`<option ${x===d.targetGrade?'selected':''}>${x}</option>`).join('')}</select></div><div class="field"><label>سابقه هدف (ماه)</label><input id="sal_targetExperience" type="number" value="${n(d.targetExperienceMonths)}" oninput="salaryCoefficientPreview()"></div><div class="field full"><label>سهم گرید از افزایش کل (%)</label><input id="sal_gradeShare" type="number" value="${n(d.gradeShare)}" oninput="salaryCoefficientPreview()"></div></div><div class="salary-note" id="sal_coefResult"></div><div class="table-wrap" style="margin-top:12px"><table class="data-table"><thead><tr><th>گرید</th><th>ضریب پیشنهادی</th><th>بدون سابقه</th><th>با سابقه هدف</th></tr></thead><tbody id="sal_coefTableBody"></tbody></table></div><button class="btn btn-primary" style="margin-top:10px" onclick="salaryApplyCoefficientProposal()">اعمال ضرایب پیشنهادی</button>`}</div>
</aside></div>`}

function viewsSalaryPersonnel(){const items=salaryPersonnelRows(),active=state.personnel.filter(p=>p.status==='فعال'),totals=active.reduce((a,p)=>{const r=salaryCompute(salaryProfileOf(p));a.base+=r.baseMonthly;a.ret+=r.returnMonthly;a.inc+=r.incentive;a.total+=r.totalMonthly;return a},{base:0,ret:0,inc:0,total:0});return pageHead('پرسنل محاسبه‌گر','همان اطلاعات پرسنل اصلی؛ بدون لیست تکراری. پروفایل حقوق هر شخص روی رکورد خودش ذخیره می‌شود.',`<button class="btn" onclick="salaryExportPersonnelCsv()">خروجی CSV</button>`)+`<div class="grid grid-4"><div class="card kpi"><div class="label">پرسنل فعال</div><div class="value">${active.length}</div></div><div class="card kpi"><div class="label">دستمزد پایه تخمینی</div><div class="value">${money(totals.base)}</div></div><div class="card kpi"><div class="label">برگشت و کارانه</div><div class="value">${money(totals.ret+totals.inc)}</div></div><div class="card kpi"><div class="label">جمع پرداخت تخمینی</div><div class="value">${money(totals.total)}</div></div></div><div class="card"><div class="toolbar"><div class="field"><label>جست‌وجو</label><input id="salp_search" value="${esc(ui.salaryPersonnelSearch)}" oninput="salaryPersonnelFilterChanged()" placeholder="نام، کد یا تلفن"></div><div class="field"><label>پوزیشن</label><select id="salp_position" onchange="salaryPersonnelFilterChanged()"><option value="">همه</option>${state.lists.positions.map(x=>`<option ${x===ui.salaryPersonnelPosition?'selected':''}>${esc(x)}</option>`).join('')}</select></div><div class="field"><label>وضعیت</label><select id="salp_status" onchange="salaryPersonnelFilterChanged()"><option value="">همه</option>${state.lists.employmentStatuses.map(x=>`<option ${x===ui.salaryPersonnelStatus?'selected':''}>${esc(x)}</option>`).join('')}</select></div></div></div><div class="card"><div class="table-wrap"><table class="data-table"><thead><tr><th>کد و نام</th><th>پوزیشن</th><th>گرید</th><th>سابقه</th><th>ساعت ماهانه</th><th>نرخ مدل</th><th>دستمزد پایه</th><th>برگشت</th><th>کارانه</th><th>جمع تخمینی</th><th></th></tr></thead><tbody>${items.map(p=>{const r=salaryCompute(salaryProfileOf(p));return `<tr><td><b>${esc(p.id+' | '+p.name)}</b></td><td>${esc(p.mainPosition||'—')}</td><td>${esc(p.gradeId||'D')}</td><td>${dec(p.experienceMonths||0,0)} ماه</td><td>${dec(r.monthlyHours,2)}</td><td>${money(r.hourly)}</td><td>${money(r.baseMonthly)}</td><td>${money(r.returnMonthly)}</td><td>${money(r.incentive)}</td><td><b>${money(r.totalMonthly)}</b></td><td class="actions"><button class="btn btn-sm" onclick="salaryOpenPersonnel('${p.id}')">محاسبه</button> <button class="btn btn-sm" onclick="salaryOpenEstimatePayslip('${p.id}')">فیش تخمینی</button> <button class="btn btn-sm" onclick="editPersonnel('${p.id}')">ویرایش پرونده</button></td></tr>`}).join('')||'<tr><td colspan="11" class="empty">پرسنلی پیدا نشد.</td></tr>'}</tbody></table></div></div>`}

function viewsSalaryRates(){const d=state.salaryModel.draft,rows=salaryRateRows();return pageHead('جدول حقوق ساعتی','جدول کامل نرخ‌ها بر اساس پوزیشن، گرید و سابقه.',`<button class="btn" onclick="salaryExportRatesCsv()">خروجی CSV</button>`)+`<div class="card"><div class="toolbar"><div class="field"><label>پوزیشن</label><select id="sal_ratePosition" onchange="salaryRateFilterChanged()"><option value="">همه</option>${state.lists.positions.map(x=>`<option ${x===d.ratePosition?'selected':''}>${esc(x)}</option>`).join('')}</select></div><div class="field"><label>گرید</label><select id="sal_rateGrade" onchange="salaryRateFilterChanged()"><option value="">همه</option>${['A','B','C','D'].map(x=>`<option ${x===d.rateGrade?'selected':''}>${x}</option>`).join('')}</select></div><div class="field"><label>حداکثر سابقه (ماه)</label><input id="sal_rateMax" type="number" value="${n(d.rateMaxMonths)}" onchange="salaryRateFilterChanged()"></div></div><div class="success-box" style="margin-top:12px">${rows.length} ردیف — نرخ پایه ساعتی ${money(salaryLegalHourly())} — رند به نزدیک‌ترین ${money(state.salaryModel.roundingStep)}</div></div><div class="card"><div class="table-wrap"><table class="data-table"><thead><tr><th>پوزیشن</th><th>گرید</th><th>سابقه</th><th>امتیاز</th><th>ضریب پوزیشن</th><th>ضریب گرید</th><th>ضریب سابقه</th><th>حقوق ساعتی</th></tr></thead><tbody>${rows.map(x=>`<tr><td>${esc(x.position)}</td><td>${x.grade}</td><td>${x.months} ماه</td><td>${x.points}</td><td>${dec(x.pc,3)}</td><td>${dec(x.gc,3)}</td><td>${dec(x.ef,3)}</td><td><b>${money(x.hourly)}</b></td></tr>`).join('')}</tbody></table></div></div>`}

function viewsSalarySettings(){const s=state.salaryModel;return pageHead('تنظیمات پایه مدل حقوق','پایه قانونی، ساعات انواع شیفت، ضرایب پوزیشن و گرید.',`<button class="btn btn-primary" onclick="salarySaveModelSettings()">ذخیره تنظیمات مدل</button>`)+`<div class="salary-storage-note">تغییرات با دکمه ذخیره، روی سرور ثبت می‌شود.</div><div class="grid grid-2" style="margin-top:16px"><div><div class="card"><div class="section-head"><h2>پارامترهای پایه</h2></div><div class="form-grid"><div class="field full"><label>پایه حقوق ماهانه وزارت کار (تومان)</label><input id="salm_labor" type="number" value="${n(s.laborMonthlyBase)}"></div><div class="field"><label>ساعت مبنای هفتگی</label><input id="salm_standard" type="number" value="${n(s.standardWeeklyHours)}"></div><div class="field"><label>تعداد هفته‌های ماه (هفته)</label><input id="salm_weeks" type="number" step="0.001" value="${n(s.weeksPerMonth)}"></div><div class="field"><label>افزایش هر ۶ ماه (%)</label><input id="salm_expstep" type="number" step="0.01" value="${n(s.experienceStepPercent)}"></div><div class="field"><label>گام رند ساعتی (تومان)</label><input id="salm_round" type="number" value="${n(s.roundingStep)}"></div><div class="field"><label>نرخ پایه ساعتی فعلی</label><input readonly value="${salaryLegalHourly()}"></div></div></div><div class="card"><div class="section-head"><h2>ساعت انواع شیفت</h2></div><div class="form-grid">${SALARY_SCHEDULE_KEYS.map(k=>`<div class="field"><label>${({weekdayMorning:'صبح عادی',weekdayEvening:'عصر عادی',thursdayMorning:'صبح پنجشنبه',thursdayEvening:'عصر پنجشنبه',fridayMorning:'صبح جمعه',fridayEvening:'عصر جمعه',fullWeekday:'روز کامل عادی',fullThursday:'روز کامل پنجشنبه',fullFriday:'روز کامل جمعه'})[k]}</label><input id="salm_h_${k}" type="number" step="0.5" value="${n(s.workHours[k])}"></div>`).join('')}</div></div></div><div><div class="card"><div class="section-head"><h2>ضرایب پوزیشن</h2></div><div class="table-wrap"><table class="data-table salary-coef-table"><thead><tr><th>پوزیشن</th><th>ضریب</th><th></th></tr></thead><tbody>${state.lists.positions.map(x=>`<tr><td>${esc(x)}</td><td><input data-salary-position="${esc(x)}" type="number" step="0.01" value="${n(s.positionCoefficients[x])||1}"></td><td><button class="btn btn-danger btn-sm" onclick="salaryDeletePosition('${encodeURIComponent(x)}')">حذف</button></td></tr>`).join('')}</tbody></table></div><div class="toolbar" style="margin-top:12px"><div class="field"><label>پوزیشن جدید</label><input id="salm_newPosition"></div><div class="field"><label>ضریب</label><input id="salm_newPositionCoef" type="number" step="0.01" value="1"></div><button class="btn" onclick="salaryAddPosition()">افزودن</button></div></div><div class="card"><div class="section-head"><h2>ضرایب گرید</h2></div><div class="table-wrap"><table class="data-table salary-coef-table"><thead><tr><th>گرید</th><th>ضریب</th></tr></thead><tbody>${['A','B','C','D'].map(x=>`<tr><td>${x}</td><td><input data-salary-grade="${x}" type="number" step="0.01" value="${n(s.gradeCoefficients[x])||1}"></td></tr>`).join('')}</tbody></table></div></div><div class="card"><h2>ذخیره تنظیمات</h2><div class="actions"><button class="btn btn-primary" onclick="saveData(true)">ذخیره روی سرور</button></div></div></div></div>`}

function viewsSettings(){const s=state.settings;return pageHead('تنظیمات و فهرست‌ها','پارامترهای عمومی عملیات از اینجا تغییر می‌کنند. نرخ پایه عملیاتی دستی مستقل از مدل قانونی حقوق است.',`<button class="btn" onclick="goView('annualCalendar')">تقویم سالانه</button>`)+`<div class="card"><div class="section-head"><h2>پارامترهای محاسباتی</h2><button class="btn btn-primary" onclick="saveSettings()">ذخیره تنظیمات</button></div><div class="form-grid">${Object.entries({baseHourlyRate:'نرخ پایه عملیاتی دستی (تومان / ساعت)',overtimeFactor:'ضریب اضافه‌کار',holidayFactor:'ضریب تعطیل',weeksPerMonth:'میانگین هفته در ماه',monthlyBudget:'بودجه حقوق (تومان)',salaryCeiling:'سقف دریافتی (تومان)',performanceMax:'حداکثر کارانه (تومان)',defaultTransport:'رفت‌وآمد پیش‌فرض (تومان)',employeeInsuranceRate:'سهم بیمه شاغل',defaultMonthlyCredit:'اعتبار ماهانه پیش‌فرض (تومان)',defaultMealCredit:'اعتبار غذای پیش‌فرض (تومان)',delayDeductionFactor:'ضریب کسر تأخیر',tomanToRial:'ضریب تومان به ریال',morningHours:'ساعات شیفت صبح',eveningHours:'ساعات شیفت عصر',doubleShiftBreakHours:'استراحت دوشیفت'}).map(([k,l])=>`<div class="field"><label>${l}</label><input type="number" step="0.01" id="set_${k}" value="${s[k]}"></div>`).join('')}</div></div><div class="card"><div class="section-head"><h2>فهرست‌های قابل انتخاب</h2><button class="btn btn-primary" onclick="saveLists()">ذخیره فهرست‌ها</button></div><div class="form-grid">${[['positions','پوزیشن‌ها'],['sections','سکشن‌ها (موارد سفارشی جدید به‌صورت پیش‌فرض در گروه سالن قرار می‌گیرند)'],['paymentTypes','انواع پرداخت'],['paymentMethods','روش‌های پرداخت'],['hallGroups','گروه‌های سالن'],['shiftStatuses','وضعیت‌های شیفت']].map(([k,l])=>`<div class="field full"><label>${l} — هر مورد در یک خط</label><textarea id="list_${k}">${esc(state.lists[k].join('\n'))}</textarea></div>`).join('')}</div></div><div class="card"><div class="section-head"><div><h2>نقشه سکشن‌ها</h2><p class="muted">وقتی تصویر خطوط محیط را ارسال کردید، فایل را کنار index.html قرار دهید و مسیر آن را اینجا بنویسید.</p></div><button class="btn btn-primary" onclick="saveFloorMapSettings()">ذخیره نقشه</button></div><div class="form-grid"><div class="field full"><label>مسیر تصویر نقشه</label><input id="floorMap_imageUrl" value="${esc(state.floorMap?.imageUrl||'')}" placeholder="./rayo-floor-map.png"></div><div class="field"><label>شفافیت تصویر پس‌زمینه</label><input id="floorMap_imageOpacity" type="number" min="0" max="1" step="0.05" value="${n(state.floorMap?.imageOpacity||.18)}"></div></div><div class="hint">محدوده‌های پیش‌فرض فقط شماتیک هستند. بعد از دریافت نقشه واقعی، مختصات سکشن‌ها در JSON قابل تنظیم است.</div><button class="btn" onclick="goView('staffingMap')">پیش‌نمایش نقشه کمبود</button></div><div class="card"><div class="section-head"><div><h2>تقویم تعطیلات رسمی</h2><p class="muted">روز تعطیل با ظرفیت جمعه و روز قبل آن با ظرفیت پنجشنبه محاسبه می‌شود.</p></div><div><button class="btn" onclick="goView('annualCalendar')">نمای سالانه</button> <button class="btn btn-primary" onclick="editHoliday()">+ افزودن تعطیلی</button></div></div><div class="holiday-legend"><span class="official">تعطیل رسمی</span><span class="eve">روز قبل تعطیل</span></div><div class="table-wrap" style="margin-top:12px"><table class="data-table"><thead><tr><th>تاریخ</th><th>عنوان</th><th>وضعیت</th><th></th></tr></thead><tbody>${(state.holidays||[]).sort((a,b)=>(parseJDate(a.date)?.code||0)-(parseJDate(b.date)?.code||0)).map(h=>`<tr><td>${esc(h.date)}</td><td>${esc(h.title||'تعطیل رسمی')}</td><td>${badge(h.active===false?'غیرفعال':'فعال')}</td><td><button class="btn btn-sm" onclick="editHoliday('${h.id}')">ویرایش</button> <button class="btn btn-danger btn-sm" onclick="removeItem('holidays','${h.id}','حذف تعطیلی')">حذف</button></td></tr>`).join('')||'<tr><td colspan="4" class="empty">تاریخ تعطیلی ثبت نشده است.</td></tr>'}</tbody></table></div></div>`}
function saveFloorMapSettings(){state.floorMap.imageUrl=$('floorMap_imageUrl').value.trim();state.floorMap.imageOpacity=Math.min(1,Math.max(0,n($('floorMap_imageOpacity').value)));commit('ویرایش تنظیمات نقشه سکشن‌ها')}
function editHoliday(id,presetDate=''){const h=id?(state.holidays||[]).find(x=>x.id===id):{date:presetDate||'',title:'',active:true};openForm(id?'ویرایش تعطیلی':'افزودن تعطیلی',[{name:'date',label:'تاریخ شمسی',placeholder:'1405/04/15'},{name:'title',label:'عنوان تعطیلی'},{name:'active',label:'فعال',type:'checkbox'}],h,async o=>{if(!parseJDate(o.date))throw Error('تاریخ شمسی معتبر وارد کنید');const duplicate=(state.holidays||[]).find(x=>x.id!==id&&x.date===o.date);if(duplicate)Object.assign(duplicate,o);else if(id)Object.assign(h,o);else state.holidays.push({id:uid('HOL',state.holidays),...o});closeModal();await commit(id?'ویرایش تعطیلی':duplicate?'بروزرسانی تعطیلی تکراری':'افزودن تعطیلی')})}
function saveSettings(){qsa('[id^=set_]').forEach(e=>state.settings[e.id.slice(4)]=n(e.value));commit('ویرایش تنظیمات محاسباتی')}function saveLists(){qsa('[id^=list_]').forEach(e=>state.lists[e.id.slice(5)]=e.value.split('\n').map(x=>x.trim()).filter(Boolean));commit('ویرایش فهرست‌ها')}
function viewsChangelog(){return pageHead('تاریخچه تغییرات','هر افزودن، ویرایش یا حذف مهم ثبت می‌شود.')+`<div class="card"><div class="table-wrap"><table class="data-table"><thead><tr><th>زمان</th><th>عملیات</th><th>کد</th></tr></thead><tbody>${state.changeLog.map(x=>`<tr><td>${new Date(x.at).toLocaleString('fa-IR')}</td><td>${esc(x.action)}</td><td>${x.id}</td></tr>`).join('')||'<tr><td colspan="3" class="empty">تغییری ثبت نشده است.</td></tr>'}</tbody></table></div></div>`}

/* ====================== V5 OVERRIDES ====================== */
const STATIC_USERS_V5={Admin:'Salar!%',Ziba:'Ziba123!',Mehran:'Ava!%'};
let currentAuthUserV5=sessionStorage.getItem('rayo_admin_user')||'';
function applyAuthV5(){const ok=Boolean(currentAuthUserV5);$('appShell')?.classList.toggle('auth-locked',!ok);$('loginScreen')?.classList.toggle('hidden',ok);if($('currentAuthUser'))$('currentAuthUser').textContent=ok?`کاربر: ${currentAuthUserV5}`:'';if(!ok)setTimeout(()=>$('loginUsername')?.focus(),50)}
function loginV5(e){e?.preventDefault();const u=$('loginUsername').value.trim(),p=$('loginPassword').value;if(STATIC_USERS_V5[u]===p){currentAuthUserV5=u;sessionStorage.setItem('rayo_admin_user',u);$('loginError').textContent='';applyAuthV5();const nx=new URLSearchParams(location.search).get('next');if(nx&&/^[a-z0-9_.?=&%-]+$/i.test(nx))location.href=nx}else $('loginError').textContent='نام کاربری یا رمز عبور اشتباه است.'}
function logoutV5(){sessionStorage.removeItem('rayo_admin_user');currentAuthUserV5='';if($('loginPassword'))$('loginPassword').value='';applyAuthV5()}

const PERSONNEL_TAXONOMY_V5={
  groups:['سالن','آشپزخانه','خدمات'],
  sections:{'سالن':['بار','صندوق','هاست','سالن بالا','قلیان‌خانه','سالن پایین','پیک','پارکینگ'],'آشپزخانه':['آشپزخانه'],'خدمات':['خدمات']},
  positions:{'سالن':['سالن‌کار','ویتر','هاست','صندوقدار','باریستا','قلیان‌زن','پیک','پارک‌بان','مدیر/سرپرست'],'آشپزخانه':['سرآشپز','آماده‌ساز','تخته‌کار','وسط‌کار','ظرفشور','سالادزن','ساندویچ‌زن','پاستازن','گریل‌کار','پیتزازن','فیش‌خوان'],'خدمات':['خدماتی']},
  kitchenRanks:['سرآشپز','آشپز','کمک‌آشپز','سایر']
};
function normalizeSectionV5(s){const m={'سالن':'سالن پایین','حیاط':'سالن پایین','تراس':'سالن بالا','قلیان':'قلیان‌خانه','ورودی':'هاست'};return m[s]||s}
function normalizePositionV5(p){const m={'صندوق':'صندوقدار','بار':'باریستا','قلیان':'قلیان‌زن','نظافت‌چی':'خدماتی','ظرف‌شور':'ظرفشور','آشپز':'وسط‌کار','کمک‌آشپز':'آماده‌ساز'};return m[p]||p}
function uniqueTextV51(items){return [...new Set((items||[]).map(x=>String(x||'').trim()).filter(Boolean))]}
function configuredSectionsV51(){return uniqueTextV51(state?.lists?.sections||[])}
function configuredPositionsV51(){return uniqueTextV51(state?.lists?.positions||[])}
function sectionsForGroupV51(group){
  const base=PERSONNEL_TAXONOMY_V5.sections[group]||[];
  const all=configuredSectionsV51();
  const kitchenBase=PERSONNEL_TAXONOMY_V5.sections['آشپزخانه'];
  const serviceBase=PERSONNEL_TAXONOMY_V5.sections['خدمات'];
  if(group==='آشپزخانه')return uniqueTextV51([...base,...all.filter(x=>kitchenBase.includes(x))]);
  if(group==='خدمات')return uniqueTextV51([...base,...all.filter(x=>serviceBase.includes(x))]);
  // سکشن‌های سفارشی که در گروه ثابت آشپزخانه/خدمات نیستند، به‌صورت پیش‌فرض سکشن سالن محسوب می‌شوند.
  return uniqueTextV51([...base,...all.filter(x=>!kitchenBase.includes(x)&&!serviceBase.includes(x))]);
}
function positionsForGroupV51(group){
  const base=PERSONNEL_TAXONOMY_V5.positions[group]||[];
  const all=configuredPositionsV51();
  const kitchenBase=PERSONNEL_TAXONOMY_V5.positions['آشپزخانه'];
  const serviceBase=PERSONNEL_TAXONOMY_V5.positions['خدمات'];
  if(group==='آشپزخانه')return uniqueTextV51([...base,...all.filter(x=>kitchenBase.includes(x))]);
  if(group==='خدمات')return uniqueTextV51([...base,...all.filter(x=>serviceBase.includes(x))]);
  return uniqueTextV51([...base,...all.filter(x=>!kitchenBase.includes(x)&&!serviceBase.includes(x))]);
}
function groupForSectionV51(section){
  if(sectionsForGroupV51('آشپزخانه').includes(section))return'آشپزخانه';
  if(sectionsForGroupV51('خدمات').includes(section))return'خدمات';
  return'سالن';
}
function inferPersonnelGroupV5(p){const s=normalizeSectionV5(p.section||''),pos=normalizePositionV5(p.mainPosition||'');if(groupForSectionV51(s)==='آشپزخانه'||positionsForGroupV51('آشپزخانه').includes(pos))return'آشپزخانه';if(groupForSectionV51(s)==='خدمات'||positionsForGroupV51('خدمات').includes(pos))return'خدمات';return'سالن'}
function groupClassV5(g){return g==='آشپزخانه'?'kitchen':g==='خدمات'?'service':'hall'}

const migrateV4Base=migrate;
migrate=function(d){const x=migrateV4Base(d);x.meta.schemaVersion='2.4.1';x.settings.leaveBalanceStartDate=x.settings.leaveBalanceStartDate||'1405/05/01';x.settings.monthlyLeaveEntitlementDays=n(x.settings.monthlyLeaveEntitlementDays)||2.5;
  const savedSections=uniqueTextV51([...(d?.lists?.sections||[]),...(x.lists.sections||[])]).map(normalizeSectionV5);
  const savedPositions=uniqueTextV51([...(d?.lists?.positions||[]),...(x.lists.positions||[])]).map(normalizePositionV5);
  const baseSections=Object.values(PERSONNEL_TAXONOMY_V5.sections).flat();
  const basePositions=Object.values(PERSONNEL_TAXONOMY_V5.positions).flat();
  x.lists.personnelGroups=[...PERSONNEL_TAXONOMY_V5.groups];
  x.lists.sections=uniqueTextV51([...baseSections,...savedSections]);
  x.lists.positions=uniqueTextV51([...basePositions,...savedPositions]);
  x.lists.hallSections=uniqueTextV51([...(d?.lists?.hallSections||[]),...PERSONNEL_TAXONOMY_V5.sections['سالن'],...savedSections.filter(v=>!PERSONNEL_TAXONOMY_V5.sections['آشپزخانه'].includes(v)&&!PERSONNEL_TAXONOMY_V5.sections['خدمات'].includes(v))]);
  x.lists.kitchenSections=uniqueTextV51([...(d?.lists?.kitchenSections||[]),...PERSONNEL_TAXONOMY_V5.sections['آشپزخانه']]);
  x.lists.serviceSections=uniqueTextV51([...(d?.lists?.serviceSections||[]),...PERSONNEL_TAXONOMY_V5.sections['خدمات']]);
  x.lists.hallPositions=uniqueTextV51([...(d?.lists?.hallPositions||[]),...PERSONNEL_TAXONOMY_V5.positions['سالن'],...savedPositions.filter(v=>!PERSONNEL_TAXONOMY_V5.positions['آشپزخانه'].includes(v)&&!PERSONNEL_TAXONOMY_V5.positions['خدمات'].includes(v))]);
  x.lists.kitchenPositions=uniqueTextV51([...(d?.lists?.kitchenPositions||[]),...PERSONNEL_TAXONOMY_V5.positions['آشپزخانه']]);
  x.lists.servicePositions=uniqueTextV51([...(d?.lists?.servicePositions||[]),...PERSONNEL_TAXONOMY_V5.positions['خدمات']]);
  x.lists.kitchenStations=PERSONNEL_TAXONOMY_V5.positions['آشپزخانه'].filter(v=>v!=='سرآشپز');x.lists.kitchenRanks=[...PERSONNEL_TAXONOMY_V5.kitchenRanks];x.lists.tipTypes=['فردی','سالن','کلی'];x.lists.hallGroups=[];
  x.personnel=x.personnel.map(p=>{p.section=normalizeSectionV5(p.section||'');p.mainPosition=normalizePositionV5(p.mainPosition||'');p.backupPosition=p.backupPosition?normalizePositionV5(p.backupPosition):'';p.personnelGroup=p.personnelGroup||inferPersonnelGroupV5(p);if(p.personnelGroup==='آشپزخانه'){p.section='آشپزخانه';p.kitchenRank=p.mainPosition==='سرآشپز'?'سرآشپز':(p.kitchenRank||'آشپز')}else if(p.personnelGroup==='خدمات'){p.section='خدمات';p.kitchenRank=''}else p.kitchenRank='';delete p.tipGroup;if(p.salaryProfile){p.salaryProfile.position=normalizePositionV5(p.salaryProfile.position||p.mainPosition);p.salaryProfile.calculationMonth=n(p.salaryProfile.calculationMonth)||1}return p});
  x.staffingRequirements=x.staffingRequirements.map(r=>({...r,section:normalizeSectionV5(r.section),position:normalizePositionV5(r.position)}));x.shiftRecords=x.shiftRecords.map(r=>({...r,section:normalizeSectionV5(r.section),position:normalizePositionV5(r.position)}));
  x.salaryModel.weeksPerMonthFirstHalf=n(x.salaryModel.weeksPerMonthFirstHalf)||4.429;x.salaryModel.weeksPerMonthSecondHalf=n(x.salaryModel.weeksPerMonthSecondHalf)||4.286;x.salaryModel.draft.calculationMonth=n(x.salaryModel.draft.calculationMonth)||parseJDate(todayJ()).m;x.lists.positions.forEach(p=>{if(x.salaryModel.positionCoefficients[p]==null)x.salaryModel.positionCoefficients[p]=1});
  x.floorMap={...x.floorMap,regions:[{section:'سالن پایین',x:38,y:8,w:20,h:48},{section:'سالن بالا',x:61,y:8,w:34,h:23},{section:'بار',x:23,y:8,w:12,h:24},{section:'صندوق',x:8,y:8,w:12,h:15},{section:'هاست',x:8,y:26,w:12,h:14},{section:'آشپزخانه',x:3,y:48,w:25,h:44},{section:'خدمات',x:31,y:52,w:10,h:18},{section:'قلیان‌خانه',x:31,y:73,w:13,h:19},{section:'پیک',x:47,y:73,w:10,h:19},{section:'پارکینگ',x:61,y:61,w:34,h:31}]};
  x.tipGroups=x.tipGroups.map(g=>{if(g.type==='گروهی')g.type='سالن';if(!['فردی','سالن','کلی'].includes(g.type))g.type='فردی';delete g.hallGroup;return g});return x};

ui.tipFilter={year:'',month:'',personnelId:'',type:'',status:''};ui.penaltyFilter={year:'',month:'',personnelId:'',type:'',status:''};ui.consumptionFilter={year:'',month:'',personnelId:'',type:''};ui.leaveFilter={year:'',month:'',personnelId:'',type:''};ui.delayReport.year='';ui.delayReport.month='';ui.delayReport.type='';ui.payroll.personnelId='';ui.payroll.status='';

const initV4Base=init;init=async function(){await initV4Base();applyAuthV5()};

function editPersonnel(id){const p=id?person(id):{status:'فعال',personnelGroup:'سالن',section:'سالن پایین',mainPosition:'سالن‌کار',backupPosition:'',kitchenRank:'',transportMonthly:0,fixedAllowance:0,hourlyRate:0,monthlyCredit:0,mealCredit:0,gradeId:'D',experienceMonths:0};p.personnelGroup=p.personnelGroup||inferPersonnelGroupV5(p);$('modalTitle').textContent=id?'ویرایش پرسنل':'افزودن پرسنل';$('modalBody').innerHTML=`<div class="taxonomy-note">ابتدا گروه کلی نیرو را انتخاب کنید. سکشن و پوزیشن بر اساس همان گروه محدود می‌شوند تا ترکیب نامعتبر ثبت نشود.</div><div class="form-grid" style="margin-top:12px"><div class="field"><label>نام و نام خانوادگی</label><input id="pv_name" value="${esc(p.name||'')}"></div><div class="field"><label>گروه کلی</label><select id="pv_group" onchange="refreshPersonnelTaxonomyV5()">${PERSONNEL_TAXONOMY_V5.groups.map(x=>`<option ${x===p.personnelGroup?'selected':''}>${x}</option>`).join('')}</select></div><div class="field"><label>سکشن</label><select id="pv_section"></select></div><div class="field"><label>پوزیشن اصلی</label><select id="pv_main" onchange="refreshPersonnelRankV5()"></select></div><div class="field"><label>پوزیشن بک‌آپ</label><select id="pv_backup"></select></div><div class="field" id="pv_rank_wrap"><label>رده آشپزخانه</label><select id="pv_rank">${PERSONNEL_TAXONOMY_V5.kitchenRanks.map(x=>`<option ${x===(p.kitchenRank||'آشپز')?'selected':''}>${x}</option>`).join('')}</select></div><div class="field"><label>ملیت</label><select id="pv_nationality">${optionList(state.lists.nationalities,p.nationality)}</select></div><div class="field"><label>وضعیت بیمه</label><select id="pv_insurance">${optionList(state.lists.insuranceStatuses,p.insurance)}</select></div><div class="field"><label>تاریخ شروع</label><input id="pv_start" value="${esc(p.startDate||'')}" placeholder="1405/04/01"></div><div class="field"><label>شماره تماس</label><input id="pv_phone" value="${esc(p.phone||'')}"></div><section class="bank-card-v642" style="grid-column:1/-1;border:2px solid #84caff;background:#eff8ff;border-radius:14px;padding:14px;margin:2px 0 6px"><div style="font-weight:800;color:#175cd3;margin-bottom:10px">🏦 اطلاعات حساب دریافت حقوق</div><div style="font-size:12px;color:#475467;margin-bottom:12px">حساب می‌تواند به نام خود پرسنل یا شخص دیگری باشد.</div><div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px"><div class="field"><label>نام صاحب حساب</label><input id="pv_account_holder" value="${esc(p.accountHolderName||'')}" autocomplete="off"></div><div class="field"><label>نام بانک</label><input id="pv_bank_name" value="${esc(p.bankName||'')}" autocomplete="off"></div><div class="field"><label>شماره کارت</label><input id="pv_card_number" value="${esc(p.cardNumber||'')}" inputmode="numeric" autocomplete="off" placeholder="16 رقم"></div><div class="field"><label>شماره حساب</label><input id="pv_account_number" value="${esc(p.accountNumber||'')}" inputmode="numeric" autocomplete="off"></div><div class="field" style="grid-column:1/-1"><label>شماره شبا</label><input id="pv_iban" value="${esc(p.iban||'')}" dir="ltr" autocomplete="off" placeholder="IRxxxxxxxxxxxxxxxxxxxxxxxx"></div></div></section><div class="field"><label>نوع همکاری</label><select id="pv_employment">${optionList(state.lists.employmentTypes,p.employmentType)}</select></div><div class="field"><label>وضعیت همکاری</label><select id="pv_status">${optionList(state.lists.employmentStatuses,p.status)}</select></div><div class="field"><label>گرید مدل حقوق</label><select id="pv_grade">${['A','B','C','D'].map(x=>`<option ${x===(p.gradeId||'D')?'selected':''}>${x}</option>`).join('')}</select></div><div class="field"><label>سابقه قابل محاسبه (ماه)</label><input id="pv_exp" type="number" value="${n(p.experienceMonths)}"></div><div class="field"><label>دستمزد ساعتی</label><input id="pv_hourly" type="number" value="${n(p.hourlyRate)}"></div><div class="field"><label>رفت‌وآمد ماهانه</label><input id="pv_transport" type="number" value="${n(p.transportMonthly)}"></div><div class="field"><label>فوق‌العاده ثابت</label><input id="pv_fixed" type="number" value="${n(p.fixedAllowance)}"></div><div class="field"><label>سقف اعتبار ماهانه</label><input id="pv_credit" type="number" value="${n(p.monthlyCredit)}"></div><div class="field"><label>سقف غذای پرسنلی</label><input id="pv_meal" type="number" value="${n(p.mealCredit)}"></div><div class="field full"><label>توضیحات</label><textarea id="pv_notes">${esc(p.notes||'')}</textarea></div></div>`;$('modalFoot').innerHTML=`<button class="btn" onclick="closeModal()">انصراف</button><button class="btn btn-primary" onclick="savePersonnelV5('${id||''}')">ذخیره</button>`;$('modalBackdrop').classList.add('open');refreshPersonnelTaxonomyV5(p.section,p.mainPosition,p.backupPosition)}
function refreshPersonnelTaxonomyV5(section='',main='',backup=''){const g=$('pv_group').value,sections=sectionsForGroupV51(g),positions=positionsForGroupV51(g);const se=$('pv_section'),ma=$('pv_main'),ba=$('pv_backup');const curS=section||se.value,curM=main||ma.value,curB=backup||ba.value;se.innerHTML=sections.map(x=>`<option ${x===curS?'selected':''}>${x}</option>`).join('');ma.innerHTML=positions.map(x=>`<option ${x===curM?'selected':''}>${x}</option>`).join('');ba.innerHTML='<option value="">بدون بک‌آپ</option>'+positions.map(x=>`<option ${x===curB?'selected':''}>${x}</option>`).join('');if(curS&&sections.includes(curS))se.value=curS;if(curM&&positions.includes(curM))ma.value=curM;if(curB&&positions.includes(curB))ba.value=curB;$('pv_rank_wrap').style.display=g==='آشپزخانه'?'flex':'none';refreshPersonnelRankV5()}
function refreshPersonnelRankV5(){if($('pv_group')?.value==='آشپزخانه'&&$('pv_main')?.value==='سرآشپز')$('pv_rank').value='سرآشپز'}
async function savePersonnelV5(id){const g=$('pv_group').value,section=$('pv_section').value,main=$('pv_main').value,backup=$('pv_backup').value;if(!$('pv_name').value.trim())return toast('نام الزامی است',true);if(!sectionsForGroupV51(g).includes(section)||!positionsForGroupV51(g).includes(main)||(backup&&!positionsForGroupV51(g).includes(backup)))return toast('ترکیب گروه، سکشن و پوزیشن معتبر نیست',true);const o={name:$('pv_name').value.trim(),personnelGroup:g,section,mainPosition:main,backupPosition:backup,kitchenRank:g==='آشپزخانه'?$('pv_rank').value:'',nationality:$('pv_nationality').value,insurance:$('pv_insurance').value,startDate:$('pv_start').value,phone:$('pv_phone').value,employmentType:$('pv_employment').value,status:$('pv_status').value,gradeId:$('pv_grade').value,experienceMonths:n($('pv_exp').value),hourlyRate:n($('pv_hourly').value),transportMonthly:n($('pv_transport').value),fixedAllowance:n($('pv_fixed').value),monthlyCredit:n($('pv_credit').value),mealCredit:n($('pv_meal').value),accountHolderName:String($('pv_account_holder')?.value||'').trim(),bankName:String($('pv_bank_name')?.value||'').trim(),cardNumber:String($('pv_card_number')?.value||'').trim(),accountNumber:String($('pv_account_number')?.value||'').trim(),iban:String($('pv_iban')?.value||'').trim(),notes:$('pv_notes').value};let p;if(id){p=person(id);Object.assign(p,o)}else{p={id:uid('EMP',state.personnel,4),...o};state.personnel.push(p)}delete p.tipGroup;p.salaryProfile={position:main,grade:p.gradeId||'D',experienceMonths:p.experienceMonths||0,schedule:{weekdayMorning:0,weekdayEvening:0,thursdayMorning:0,thursdayEvening:0,fridayMorning:0,fridayEvening:0,fullWeekday:0,fullThursday:0,fullFriday:0},returnAid:0,incentive:0,contractMonthly:0,calculationMonth:parseJDate(todayJ()).m,updatedAt:new Date().toISOString(),...(p.salaryProfile||{}),position:main};closeModal();await commit(id?'ویرایش پرسنل':'افزودن پرسنل')}

const viewsPersonnelV4=viewsPersonnel;viewsPersonnel=function(){let out=viewsPersonnelV4();out=out.replace('<th>سکشن</th><th>پوزیشن اصلی</th>','<th>گروه</th><th>سکشن</th><th>پوزیشن اصلی</th><th>رده آشپزخانه</th>');out=out.replaceAll(/<td>\$\{esc\(p\.section\|\|'—'\)\}<\/td>/g,'');return out.replace(/<tbody>\$\{items\.map[\s\S]*?<\/tbody>/,'')||out};
// Full personnel renderer with taxonomy columns and existing capacity analysis.
viewsPersonnel=function(){const q=ui.personnelSearch.toLowerCase(),items=state.personnel.filter(p=>(p.name+p.id+p.mainPosition+(p.section||'')+(p.personnelGroup||'')).toLowerCase().includes(q)),cap=staffingCapacityRows(),shortage=cap.reduce((s,x)=>s+Math.max(-x.delta,0),0),surplus=cap.reduce((s,x)=>s+Math.max(x.delta,0),0),covered=cap.filter(x=>x.delta===0).length;const capacityBlock=cap.length?`<div class="staffing-summary"><div class="card kpi"><div class="label">کمبود نیروی ثابت</div><div class="value danger-text">${shortage}</div></div><div class="card kpi"><div class="label">مازاد نیروی ثابت</div><div class="value positive">${surplus}</div></div><div class="card kpi"><div class="label">ترکیب‌های کامل</div><div class="value">${covered}</div><div class="sub">از ${cap.length}</div></div><div class="card kpi"><div class="label">نیروی فعال</div><div class="value">${activePersonnel().length}</div></div></div><div class="card"><div class="section-head"><h2>تحلیل ظرفیت پرسنل ثابت</h2><div><button class="btn" onclick="goView('staffingNeeds')">نیروی موردنیاز</button> <button class="btn" onclick="goView('staffingMap')">نقشه کمبود</button></div></div><div class="table-wrap"><table class="data-table"><thead><tr><th>سکشن</th><th>پوزیشن</th><th>حداکثر نیاز</th><th>اصلی فعال</th><th>بک‌آپ</th><th>وضعیت</th></tr></thead><tbody>${cap.map(x=>`<tr><td>${esc(x.section)}</td><td>${esc(x.position)}</td><td>${x.peakRequired}</td><td>${x.main}</td><td>${x.backup}</td><td>${x.delta<0?badge(`کمبود ${Math.abs(x.delta)}`):x.delta>0?badge(`مازاد ${x.delta}`):badge('کامل')}</td></tr>`).join('')}</tbody></table></div></div>`:'<div class="card"><div class="hint">برای تحلیل کمبود ابتدا نیروی موردنیاز را تعریف کنید.</div></div>';return pageHead('لیست پرسنل','هر نیرو در یکی از سه گروه سالن، آشپزخانه یا خدمات ثبت می‌شود.',`<button class="btn btn-primary" onclick="editPersonnel()">+ افزودن پرسنل</button>`)+capacityBlock+`<div class="card"><div class="toolbar"><div class="field"><label>جست‌وجو</label><input value="${esc(ui.personnelSearch)}" data-live-filter="ui.personnelSearch" oninput="rayoLiveFilter(this,ui,'personnelSearch')" placeholder="نام، کد، گروه، سکشن یا پوزیشن"></div></div></div><div class="card"><div class="table-wrap"><table class="data-table"><thead><tr><th>کد</th><th>نام</th><th>گروه</th><th>سکشن</th><th>پوزیشن اصلی</th><th>رده آشپزخانه</th><th>بک‌آپ</th><th>بیمه</th><th>شروع کار</th><th>نرخ ساعتی</th><th>وضعیت</th><th></th></tr></thead><tbody>${items.map(p=>`<tr><td>${p.id}</td><td><b>${esc(p.name)}</b></td><td><span class="group-badge ${groupClassV5(p.personnelGroup)}">${esc(p.personnelGroup||inferPersonnelGroupV5(p))}</span></td><td>${esc(p.section||'—')}</td><td>${esc(p.mainPosition||'—')}</td><td>${esc(p.kitchenRank||'—')}</td><td>${esc(p.backupPosition||'—')}</td><td>${badge(p.insurance||'نامشخص')}</td><td>${esc(p.startDate||'—')}</td><td class="num">${money(p.hourlyRate)}</td><td>${badge(p.status)}</td><td><button class="btn btn-sm" onclick="editPersonnel('${p.id}')">ویرایش</button> <button class="btn btn-danger btn-sm" onclick="removeItem('personnel','${p.id}','حذف پرسنل')">حذف</button></td></tr>`).join('')||'<tr><td colspan="13" class="empty">رکوردی نیست.</td></tr>'}</tbody></table></div></div>`}

function positionsForSectionV5(section){return positionsForGroupV51(groupForSectionV51(section))}
function editStaffingRequirement(id){const r=id?(state.staffingRequirements||[]).find(x=>x.id===id):{dayIndex:0,shift:'عصر',section:'سالن پایین',position:'سالن‌کار',requiredCount:1,active:true};$('modalTitle').textContent=id?'ویرایش نیروی موردنیاز':'تعریف نیروی موردنیاز';$('modalBody').innerHTML=`<div class="form-grid"><div class="field"><label>روز هفته</label><select id="rq_day">${state.lists.weekdays.map((x,i)=>`<option value="${i}" ${Number(r.dayIndex)===i?'selected':''}>${x}</option>`).join('')}</select></div><div class="field"><label>شیفت</label><select id="rq_shift">${optionList(['صبح','عصر'],r.shift)}</select></div><div class="field"><label>سکشن</label><select id="rq_section" onchange="refreshRequirementPositionsV5()">${state.lists.sections.map(x=>`<option ${x===r.section?'selected':''}>${x}</option>`).join('')}</select></div><div class="field"><label>پوزیشن</label><select id="rq_position"></select></div><div class="field"><label>تعداد موردنیاز (نفر)</label><input id="rq_count" type="number" min="1" value="${n(r.requiredCount)||1}"></div><div class="field"><label>فعال</label><input id="rq_active" type="checkbox" ${r.active!==false?'checked':''}></div></div><div class="taxonomy-note">پوزیشن‌های قابل انتخاب براساس سکشن محدود شده‌اند.</div>`;$('modalFoot').innerHTML=`<button class="btn" onclick="closeModal()">انصراف</button><button class="btn btn-primary" onclick="saveStaffingRequirementV5('${id||''}')">ذخیره</button>`;$('modalBackdrop').classList.add('open');refreshRequirementPositionsV5(r.position)}
function refreshRequirementPositionsV5(selected=''){const arr=positionsForSectionV5($('rq_section').value);$('rq_position').innerHTML=arr.map(x=>`<option ${x===selected?'selected':''}>${x}</option>`).join('')}
async function saveStaffingRequirementV5(id){const o={dayIndex:Number($('rq_day').value),shift:$('rq_shift').value,section:$('rq_section').value,position:$('rq_position').value,requiredCount:Math.max(1,n($('rq_count').value)),active:$('rq_active').checked};if(!positionsForSectionV5(o.section).includes(o.position))return toast('پوزیشن با سکشن سازگار نیست',true);const r=id?state.staffingRequirements.find(x=>x.id===id):null,dup=state.staffingRequirements.find(x=>x.id!==id&&Number(x.dayIndex)===o.dayIndex&&x.shift===o.shift&&x.section===o.section&&x.position===o.position);if(dup)Object.assign(dup,o);else if(r)Object.assign(r,o);else state.staffingRequirements.push({id:uid('REQ',state.staffingRequirements),...o});closeModal();await commit(id?'ویرایش نیاز نیرو':dup?'بروزرسانی نیاز تکراری':'تعریف نیاز نیرو')}

const viewsStaffingMapV4=viewsStaffingMap;viewsStaffingMap=function(){return viewsStaffingMapV4().replaceAll('قلیان</h4>','قلیان‌خانه</h4>').replaceAll('class="floor-region ','data-section="" class="floor-region ')};

function salaryWeeksForMonthV5(month){month=n(month)||parseJDate(todayJ()).m;return month<=6?n(state.salaryModel.weeksPerMonthFirstHalf)||4.429:n(state.salaryModel.weeksPerMonthSecondHalf)||4.286}
salaryLegalHourly=function(month){const den=n(state.salaryModel.standardWeeklyHours)*salaryWeeksForMonthV5(month);return den>0?salaryRound(n(state.salaryModel.laborMonthlyBase)/den):0};
salaryScheduleHours=function(sc,month){const h=state.salaryModel.workHours,weeks=salaryWeeksForMonthV5(month),weekly=SALARY_SCHEDULE_KEYS.reduce((sum,k)=>sum+n(sc?.[k])*n(h[k]),0),days=SALARY_SCHEDULE_KEYS.reduce((sum,k)=>sum+n(sc?.[k]),0),night=n(sc?.weekdayEvening)+n(sc?.thursdayEvening)+n(sc?.fridayEvening)+n(sc?.fullWeekday)+n(sc?.fullThursday)+n(sc?.fullFriday);return{weeklyHours:weekly,monthlyHours:weekly*weeks,monthlyDays:days*weeks,nightTrips:night*weeks,weeksPerMonth:weeks}};
salaryCompute=function(d){const month=n(d?.calculationMonth)||parseJDate(todayJ()).m,base=salaryLegalHourly(month),pc=n(state.salaryModel.positionCoefficients[d.position])||1,gc=n(state.salaryModel.gradeCoefficients[d.grade])||1,points=Math.floor(n(d.experienceMonths)/6),ef=1+points*n(state.salaryModel.experienceStepPercent)/100,totalFactor=pc*gc*ef,hourly=salaryRound(base*totalFactor),sh=salaryScheduleHours(d.schedule,month),baseMonthly=salaryRound(hourly*sh.monthlyHours),returnMonthly=salaryRound(sh.nightTrips*n(d.returnAid)),incentive=salaryRound(d.incentive),totalMonthly=salaryRound(baseMonthly+returnMonthly+incentive),contractHourly=sh.monthlyHours>0?salaryRound(n(d.contractMonthly)/sh.monthlyHours):0;return{month,base,pc,gc,points,ef,totalFactor,hourly,...sh,baseMonthly,returnMonthly,incentive,totalMonthly,contractHourly,gap:contractHourly-hourly}};
const salaryProfileOfV4=salaryProfileOf;salaryProfileOf=function(p){return{...salaryProfileOfV4(p),calculationMonth:n(p?.salaryProfile?.calculationMonth)||parseJDate(todayJ()).m}};
const salaryCalcReadV4=salaryCalcRead;salaryCalcRead=function(){const d=salaryCalcReadV4();d.calculationMonth=n($('sal_calcMonth')?.value)||d.calculationMonth||parseJDate(todayJ()).m;return d};
const viewsSalaryCalculatorV4=viewsSalaryCalculator;viewsSalaryCalculator=function(){let h=viewsSalaryCalculatorV4(),d=state.salaryModel.draft;const field=`<div class="field"><label>ماه محاسبه</label><select id="sal_calcMonth" onchange="salaryCalcChanged()">${state.lists.months.map((x,i)=>`<option value="${i+1}" ${i+1===n(d.calculationMonth)?'selected':''}>${x}</option>`).join('')}</select></div>`;return h.replace('<div class="field"><label>پوزیشن</label>',field+'<div class="field"><label>پوزیشن</label>').replace('جمع دریافتی تخمینی:','جمع دریافتی تخمینی بر مبنای طول ماه:')};
const viewsSalarySettingsV4=viewsSalarySettings;viewsSalarySettings=function(){let h=viewsSalarySettingsV4(),s=state.salaryModel;h=h.replace(/<div class="field"><label>تعداد هفته‌های ماه (هفته)<\/label><input id="salm_weeks"[^>]*><\/div>/,`<div class="field"><label>هفته‌های ماه در نیمه اول سال</label><input id="salm_weeks_first" type="number" step="0.001" value="${n(s.weeksPerMonthFirstHalf)}"></div><div class="field"><label>هفته‌های ماه در نیمه دوم سال</label><input id="salm_weeks_second" type="number" step="0.001" value="${n(s.weeksPerMonthSecondHalf)}"></div>`);return h};
salarySaveModelSettings=function(){const s=state.salaryModel;s.laborMonthlyBase=n($('salm_labor').value);s.standardWeeklyHours=n($('salm_standard').value)||44;s.weeksPerMonthFirstHalf=n($('salm_weeks_first').value)||4.429;s.weeksPerMonthSecondHalf=n($('salm_weeks_second').value)||4.286;s.weeksPerMonth=s.weeksPerMonthFirstHalf;s.experienceStepPercent=n($('salm_expstep').value);s.roundingStep=n($('salm_round').value)||500;SALARY_SCHEDULE_KEYS.forEach(k=>s.workHours[k]=n($('salm_h_'+k).value));qsa('[data-salary-position]').forEach(e=>s.positionCoefficients[e.dataset.salaryPosition]=n(e.value)||1);qsa('[data-salary-grade]').forEach(e=>s.gradeCoefficients[e.dataset.salaryGrade]=n(e.value)||1);state.settings.weeksPerMonth=s.weeksPerMonthFirstHalf;state.settings.baseHourlyRate=salaryLegalHourly(parseJDate(todayJ()).m);commit('ویرایش تنظیمات مدل حقوق')};

function tipEligibleV5(){return [...activePersonnel()].sort((a,b)=>a.name.localeCompare(b.name,'fa'))}
function tipDefaultSelectedV5(type,p){if(type==='کلی')return true;if(type==='سالن')return p.personnelGroup==='سالن'&&['سالن بالا','سالن پایین','بار','هاست'].includes(p.section);return false}
function tipFilterRowsV5(){const f=ui.tipFilter;return [...state.tipGroups].filter(g=>{const q=periodOf(g.receiveDate);return(!f.year||q.year===Number(f.year))&&(!f.month||q.month===Number(f.month))&&(!f.type||g.type===f.type)&&(!f.status||g.status===f.status)&&(!f.personnelId||tipShares(g).some(x=>x.personnelId===f.personnelId))}).sort((a,b)=>dateCode(b.receiveDate)-dateCode(a.receiveDate))}
viewsTips=function(){const f=ui.tipFilter,rows=tipFilterRowsV5(),total=rows.filter(x=>x.status!=='ابطال‌شده').reduce((s,x)=>s+n(x.totalAmount),0),settled=rows.reduce((s,x)=>s+effectiveSettled(x),0);return pageHead('انعام و تقسیم سهم','انعام فردی، سالن یا کلی ثبت می‌شود و سهم افراد خودکار محاسبه می‌شود.',`<button class="btn btn-primary" onclick="editTip()">+ ثبت انعام</button>`)+`<div class="card"><div class="filter-grid"><div class="field"><label>سال</label><input type="number" value="${esc(f.year)}" onchange="ui.tipFilter.year=this.value;renderView()"></div><div class="field"><label>ماه</label><select onchange="ui.tipFilter.month=this.value;renderView()"><option value="">همه ماه‌ها</option>${state.lists.months.map((x,i)=>`<option value="${i+1}" ${String(f.month)===String(i+1)?'selected':''}>${x}</option>`).join('')}</select></div><div class="field"><label>پرسنل</label><select onchange="ui.tipFilter.personnelId=this.value;renderView()">${allPersonOptions(f.personnelId,true)}</select></div><div class="field"><label>نوع</label><select onchange="ui.tipFilter.type=this.value;renderView()"><option value="">همه</option>${state.lists.tipTypes.map(x=>`<option ${f.type===x?'selected':''}>${x}</option>`).join('')}</select></div><div class="field"><label>وضعیت</label><select onchange="ui.tipFilter.status=this.value;renderView()"><option value="">همه</option>${state.lists.tipStatuses.map(x=>`<option ${f.status===x?'selected':''}>${x}</option>`).join('')}</select></div></div></div><div class="grid grid-3"><div class="card kpi"><div class="label">جمع فیلترشده</div><div class="value">${money(total)}</div></div><div class="card kpi"><div class="label">تسویه‌شده</div><div class="value">${money(settled)}</div></div><div class="card kpi"><div class="label">مانده</div><div class="value">${money(total-settled)}</div></div></div><div class="card"><div class="table-wrap"><table class="data-table"><thead><tr><th>کد</th><th>تاریخ</th><th>نوع</th><th>مبلغ</th><th>افراد و سهم</th><th>تسویه</th><th>وضعیت</th><th></th></tr></thead><tbody>${rows.map(g=>`<tr><td>${g.id}</td><td>${g.receiveDate}</td><td>${badge(g.type)}</td><td>${money(g.totalAmount)}</td><td>${tipShares(g).map(x=>`${esc(person(x.personnelId)?.name||x.personnelId)}: <b>${money(x.amount)}</b>`).join('<br>')}</td><td>${money(effectiveSettled(g))}</td><td>${badge(g.status)}</td><td><button class="btn btn-sm" onclick="editTip('${g.id}')">ویرایش</button> <button class="btn btn-danger btn-sm" onclick="removeItem('tipGroups','${g.id}','حذف انعام')">حذف</button></td></tr>`).join('')||'<tr><td colspan="8" class="empty">انعامی پیدا نشد.</td></tr>'}</tbody></table></div></div>`}
function tipCalculateTotal(){
 const read=id=>normalizeDigits($(id).value).replace(/[\s,٬.]/g,'');
 const bill=read('tip_bill'),paid=read('tip_paid');
 if(!/^\d+$/.test(bill)||!/^\d+$/.test(paid))return toast('مبلغ فیش و پرداختی را به تومان و به‌صورت عدد صحیح وارد کنید',true);
 const billAmount=Number(bill),paidAmount=Number(paid);
 if(!Number.isSafeInteger(billAmount)||!Number.isSafeInteger(paidAmount))return toast('مبلغ واردشده معتبر نیست',true);
 if(paidAmount<billAmount)return toast('مبلغ پرداختی نباید کمتر از مبلغ فیش باشد',true);
 $('tip_total').value=Math.floor((paidAmount-billAmount)/1000)*1000;
}
function editTip(id){const g=id?state.tipGroups.find(x=>x.id===id):{receiveDate:todayJ(),type:'فردی',totalAmount:0,receiveMethod:'نقدی',status:'ثبت‌شده',settledAmount:0,settlementDate:'',settlementMethod:'',notes:'',participants:[]};window.tipEditV5={id,existing:new Map((g.participants||[]).map(x=>[x.personnelId,x.weight]))};$('modalTitle').textContent=id?'ویرایش انعام':'ثبت انعام';$('modalBody').innerHTML=`<div class="form-grid"><div class="field"><label>تاریخ</label><input id="tip_date" value="${esc(g.receiveDate)}"></div><div class="field"><label>نوع انعام</label><select id="tip_type" onchange="refreshTipPeopleV5()">${optionList(state.lists.tipTypes,g.type)}</select></div><div class="field full"><details><summary>محاسبه انعام از فیش و پرداخت مشتری</summary><div class="form-grid"><div class="field"><label for="tip_bill">مبلغ فیش (تومان)</label><input id="tip_bill" type="text" inputmode="numeric" autocomplete="off"></div><div class="field"><label for="tip_paid">مبلغ پرداختی مشتری (تومان)</label><input id="tip_paid" type="text" inputmode="numeric" autocomplete="off"></div><div class="field full"><span class="hint">انعام = پرداختی مشتری − مبلغ فیش؛ رو به پایین به مضرب هزار تومان گرد می‌شود. مثال: ۵۲٬۴۵۰ ← ۵۲٬۰۰۰ تومان.</span><button type="button" class="btn" onclick="tipCalculateTotal()">محاسبه و درج در مبلغ کل</button></div></div></details></div><div class="field"><label>مبلغ کل (تومان)</label><input id="tip_total" type="number" value="${n(g.totalAmount)}"></div><div class="field"><label>نحوه دریافت</label><select id="tip_receive">${optionList(state.lists.paymentMethods,g.receiveMethod)}</select></div><div class="field"><label>وضعیت</label><select id="tip_status">${optionList(state.lists.tipStatuses,g.status)}</select></div><div class="field"><label>مبلغ تسویه‌شده (تومان)</label><input id="tip_settled" type="number" value="${n(g.settledAmount)}"></div><div class="field"><label>تاریخ تسویه</label><input id="tip_settle_date" value="${esc(g.settlementDate||'')}"></div><div class="field"><label>روش تسویه</label><select id="tip_settle_method"><option value="">انتخاب کنید</option>${optionList(state.lists.settlementMethods,g.settlementMethod)}</select></div><div class="field full"><label>توضیحات</label><textarea id="tip_notes">${esc(g.notes||'')}</textarea></div></div><div class="tip-type-help" id="tipHelpV5"></div><h4>افراد مشمول و ضریب سهم</h4><div class="multi-list" id="tipPeople"></div>`;$('modalFoot').innerHTML=`<button class="btn" onclick="closeModal()">انصراف</button><button class="btn btn-primary" onclick="saveTip('${id||''}')">ذخیره</button>`;$('modalBackdrop').classList.add('open');refreshTipPeopleV5(true)}
function refreshTipPeopleV5(first=false){const type=$('tip_type').value,people=tipEligibleV5(),existing=window.tipEditV5?.existing||new Map();$('tipHelpV5').textContent=type==='سالن'?'تمام پرسنل فعال قابل انتخاب‌اند؛ نیروهای سالن، بار و هاست به‌صورت پیش‌فرض انتخاب می‌شوند.':type==='کلی'?'تمام پرسنل فعال به‌صورت پیش‌فرض انتخاب می‌شوند.':'تمام پرسنل فعال از همه بخش‌ها قابل انتخاب‌اند.';$('tipPeople').innerHTML=people.map(p=>{const checked=existing.has(p.id)||(!window.tipEditV5?.id&&tipDefaultSelectedV5(type,p));const priority=p.mainPosition==='پیک'||p.section==='پیک'?'پیک':p.mainPosition==='پارک‌بان'||p.section==='پارکینگ'?'پارک‌بان':'';return `<label class="multi-row"><input type="checkbox" value="${p.id}" ${checked?'checked':''}><span><b>${esc(p.name)}</b> ${priority?`<span class="tip-priority">${priority}</span>`:''}<br><small>${p.id} — ${esc(p.personnelGroup)} / ${esc(p.section)} / ${esc(p.mainPosition)}</small></span><input type="number" step="0.1" min="0.1" value="${existing.get(p.id)||1}"></label>`}).join('')}
saveTip=function(id){const date=$('tip_date').value;if(!parseJDate(date))return toast('تاریخ معتبر وارد کنید',true);const total=n($('tip_total').value),participants=qsa('#tipPeople .multi-row').filter(r=>qs('input[type=checkbox]',r).checked).map(r=>({personnelId:qs('input[type=checkbox]',r).value,weight:n(qs('input[type=number]',r).value)||1}));if(total<=0||!participants.length)return toast('مبلغ و حداقل یک نفر الزامی است',true);const o={receiveDate:date,type:$('tip_type').value,totalAmount:total,receiveMethod:$('tip_receive').value,status:$('tip_status').value,settledAmount:n($('tip_settled').value),settlementDate:$('tip_settle_date').value,settlementMethod:$('tip_settle_method').value,notes:$('tip_notes').value,participants};if(id)Object.assign(state.tipGroups.find(x=>x.id===id),o);else state.tipGroups.push({id:tipCode(date),...o});closeModal();commit(id?'ویرایش انعام':'ثبت انعام')};

function filterByPeriodV5(date,year,month){const p=periodOf(date);return(!year||p.year===Number(year))&&(!month||p.month===Number(month))}
viewsPenalties=function(){const f=ui.penaltyFilter,rows=[...state.penaltiesRewards].filter(x=>filterByPeriodV5(x.date,f.year,f.month)&&(!f.personnelId||x.personnelId===f.personnelId)&&(!f.type||x.type===f.type)&&(!f.status||x.status===f.status)).sort((a,b)=>dateCode(b.date)-dateCode(a.date));return pageHead('جریمه و تشویق','فقط موارد تاییدشده در حقوق اثر دارند.',`<button class="btn btn-primary" onclick="editPenalty()">+ ثبت مورد</button>`)+filterCardV5(f,'penaltyFilter',true,true)+eventTableRowsV5(rows,['تاریخ','پرسنل','نوع','مبلغ','شرح','وضعیت','تأییدکننده'],x=>[x.date,personLabel(x.personnelId),x.type,money(x.amount),x.reason||'',badge(x.status),x.approvedBy||'—'],editPenalty,'penaltiesRewards','حذف جریمه/تشویق')}
viewsConsumption=function(){const f=ui.consumptionFilter,rows=[...state.consumptions].filter(x=>filterByPeriodV5(x.date,f.year,f.month)&&(!f.personnelId||x.personnelId===f.personnelId)&&(!f.type||x.type===f.type)).sort((a,b)=>dateCode(b.date)-dateCode(a.date));return pageHead('مصرف پرسنلی','فیلتر براساس ماه، نیرو و نوع مصرف.',`<button class="btn btn-primary" onclick="editConsumption()">+ ثبت مصرف</button>`)+filterCardV5(f,'consumptionFilter',false,false,state.lists.consumptionTypes)+eventTableRowsV5(rows,['تاریخ','پرسنل','نوع','مبلغ','توضیحات'],x=>[x.date,personLabel(x.personnelId),x.type,money(x.amount),x.notes||''],editConsumption,'consumptions','حذف مصرف')}
viewsDelays=function(){const f=ui.delayReport,items=state.delays.filter(x=>filterByPeriodV5(x.date,f.year,f.month)&&(!f.personnelId||x.personnelId===f.personnelId)&&(!f.type||x.type===f.type)&&(!f.from||dateCode(x.date)>=dateCode(f.from))&&(!f.to||dateCode(x.date)<=dateCode(f.to))).sort((a,b)=>dateCode(b.date)-dateCode(a.date)),sum=items.reduce((s,x)=>s+calcDelay(x).hours,0),ded=items.reduce((s,x)=>s+calcDelay(x).deduction,0);return pageHead('ثبت و گزارش تأخیر','فیلتر کامل براساس ماه، نیرو، نوع و بازه تاریخ.',`<button class="btn btn-primary" onclick="editDelay()">+ ثبت تأخیر</button>`)+`<div class="card"><div class="filter-grid"><div class="field"><label>سال</label><input value="${esc(f.year)}" onchange="ui.delayReport.year=this.value;renderView()"></div><div class="field"><label>ماه</label><select onchange="ui.delayReport.month=this.value;renderView()"><option value="">همه</option>${state.lists.months.map((x,i)=>`<option value="${i+1}" ${String(f.month)===String(i+1)?'selected':''}>${x}</option>`).join('')}</select></div><div class="field"><label>پرسنل</label><select onchange="ui.delayReport.personnelId=this.value;renderView()">${allPersonOptions(f.personnelId,true)}</select></div><div class="field"><label>نوع</label><select onchange="ui.delayReport.type=this.value;renderView()"><option value="">همه</option>${state.lists.delayTypes.map(x=>`<option ${f.type===x?'selected':''}>${x}</option>`).join('')}</select></div><div class="field"><label>از/تا تاریخ</label><div style="display:flex;gap:4px"><input style="min-width:0" value="${esc(f.from)}" onchange="ui.delayReport.from=this.value;renderView()"><input style="min-width:0" value="${esc(f.to)}" onchange="ui.delayReport.to=this.value;renderView()"></div></div></div></div><div class="grid grid-3"><div class="card kpi"><div class="label">تعداد</div><div class="value">${items.length}</div></div><div class="card kpi"><div class="label">ساعت تأخیر</div><div class="value">${dec(sum)}</div></div><div class="card kpi"><div class="label">مبلغ کسر</div><div class="value">${money(ded)}</div></div></div><div class="card"><div class="table-wrap"><table class="data-table"><thead><tr><th>تاریخ</th><th>پرسنل</th><th>نوع</th><th>شیفت</th><th>دقیقه</th><th>کسر ساعت</th><th>کسر مبلغ</th><th></th></tr></thead><tbody>${items.map(x=>{const c=calcDelay(x);return `<tr><td>${x.date}</td><td>${personLabel(x.personnelId)}</td><td>${x.type}</td><td>${x.shift}</td><td>${c.minutes}</td><td>${dec(c.hours)}</td><td>${money(c.deduction)}</td><td><button class="btn btn-sm" onclick="editDelay('${x.id}')">ویرایش</button> <button class="btn btn-danger btn-sm" onclick="removeItem('delays','${x.id}','حذف تأخیر')">حذف</button></td></tr>`}).join('')||'<tr><td colspan="8" class="empty">موردی نیست.</td></tr>'}</tbody></table></div></div>`}
function filterCardV5(f,key,withType=false,withStatus=false,typeOptions=[]){const types=withType?state.lists.penaltyRewardTypes:typeOptions;return `<div class="card"><div class="filter-grid"><div class="field"><label>سال</label><input value="${esc(f.year)}" onchange="ui.${key}.year=this.value;renderView()"></div><div class="field"><label>ماه</label><select onchange="ui.${key}.month=this.value;renderView()"><option value="">همه</option>${state.lists.months.map((x,i)=>`<option value="${i+1}" ${String(f.month)===String(i+1)?'selected':''}>${x}</option>`).join('')}</select></div><div class="field"><label>پرسنل</label><select onchange="ui.${key}.personnelId=this.value;renderView()">${allPersonOptions(f.personnelId,true)}</select></div>${types?.length?`<div class="field"><label>نوع</label><select onchange="ui.${key}.type=this.value;renderView()"><option value="">همه</option>${types.map(x=>`<option ${f.type===x?'selected':''}>${x}</option>`).join('')}</select></div>`:''}${withStatus?`<div class="field"><label>وضعیت</label><select onchange="ui.${key}.status=this.value;renderView()"><option value="">همه</option>${state.lists.approvalStatuses.map(x=>`<option ${f.status===x?'selected':''}>${x}</option>`).join('')}</select></div>`:''}</div></div>`}
function eventTableRowsV5(rows,headers,mapper,editFn,collection,reason){return `<div class="card"><div class="table-wrap"><table class="data-table"><thead><tr>${headers.map(x=>`<th>${x}</th>`).join('')}<th></th></tr></thead><tbody>${rows.map(x=>`<tr>${mapper(x).map(v=>`<td>${v}</td>`).join('')}<td><button class="btn btn-sm" onclick="${editFn.name}('${x.id}')">ویرایش</button> <button class="btn btn-danger btn-sm" onclick="removeItem('${collection}','${x.id}','${reason}')">حذف</button></td></tr>`).join('')||`<tr><td colspan="${headers.length+1}" class="empty">رکوردی پیدا نشد.</td></tr>`}</tbody></table></div></div>`}

function leaveMonthsInclusiveV5(start,end){const a=parseJDate(start),b=parseJDate(end);if(!a||!b||a.code>b.code)return 0;return Math.max(0,(b.y-a.y)*12+b.m-a.m+1)}
function leaveBalanceForV5(p,asOf=todayJ()){const globalStart=state.settings.leaveBalanceStartDate||'1405/05/01',start=p.startDate&&dateCode(p.startDate)>dateCode(globalStart)?p.startDate:globalStart,end=parseJDate(asOf)?asOf:todayJ(),months=leaveMonthsInclusiveV5(start,end),accrued=months*n(state.settings.monthlyLeaveEntitlementDays),taken=state.leaves.filter(x=>x.personnelId===p.id&&x.type==='مرخصی استحقاقی'&&dateCode(x.fromDate)>=dateCode(start)&&dateCode(x.fromDate)<=dateCode(end)).reduce((s,x)=>s+n(x.count),0);return{start,months,accrued,taken,balance:accrued-taken}}
viewsLeaves=function(){const f=ui.leaveFilter,rows=[...state.leaves].filter(x=>filterByPeriodV5(x.fromDate,f.year,f.month)&&(!f.personnelId||x.personnelId===f.personnelId)&&(!f.type||x.type===f.type)).sort((a,b)=>dateCode(b.fromDate)-dateCode(a.fromDate)),balances=activePersonnel().map(p=>({p,...leaveBalanceForV5(p)}));return pageHead('مرخصی و غیبت','مانده مرخصی از تاریخ مبنا تا ماه جاری محاسبه می‌شود.',`<button class="btn btn-primary" onclick="editLeave()">+ ثبت مرخصی/غیبت</button>`)+`<div class="card"><div class="filter-grid"><div class="field"><label>سال</label><input value="${esc(f.year)}" onchange="ui.leaveFilter.year=this.value;renderView()"></div><div class="field"><label>ماه</label><select onchange="ui.leaveFilter.month=this.value;renderView()"><option value="">همه</option>${state.lists.months.map((x,i)=>`<option value="${i+1}" ${String(f.month)===String(i+1)?'selected':''}>${x}</option>`).join('')}</select></div><div class="field"><label>پرسنل</label><select onchange="ui.leaveFilter.personnelId=this.value;renderView()">${allPersonOptions(f.personnelId,true)}</select></div><div class="field"><label>نوع</label><select onchange="ui.leaveFilter.type=this.value;renderView()"><option value="">همه</option>${state.lists.leaveTypes.map(x=>`<option ${f.type===x?'selected':''}>${x}</option>`).join('')}</select></div></div></div><div class="card"><div class="section-head"><h2>مانده مرخصی تا امروز</h2><span class="muted">مبنا: ${esc(state.settings.leaveBalanceStartDate)} — ماهانه ${dec(state.settings.monthlyLeaveEntitlementDays)} روز</span></div><div class="table-wrap"><table class="data-table"><thead><tr><th>پرسنل</th><th>شروع محاسبه</th><th>ماه‌های مشمول</th><th>استحقاق</th><th>استفاده‌شده</th><th>مانده طلب</th></tr></thead><tbody>${balances.map(x=>`<tr><td>${personLabel(x.p.id)}</td><td>${x.start}</td><td>${x.months}</td><td>${dec(x.accrued)}</td><td>${dec(x.taken)}</td><td class="${x.balance<0?'danger-text':'positive'}"><b>${dec(x.balance)} روز</b></td></tr>`).join('')}</tbody></table></div></div>`+eventTableRowsV5(rows,['از تاریخ','تا تاریخ','پرسنل','نوع','تعداد روز/شیفت','توضیحات'],x=>[x.fromDate,x.toDate,personLabel(x.personnelId),x.type,x.count||'—',esc(x.notes||'')],editLeave,'leaves','حذف مرخصی/غیبت')}

const viewsPayrollV4=viewsPayroll;viewsPayroll=function(){const f=ui.payroll;let all=payrollRowsForPeriod(f.year,f.month),rows=all.filter(r=>(!f.personnelId||r.personnelId===f.personnelId)&&(!f.status||r.status===f.status)),c=payrollClosure(f.year,f.month),base=pageHead('کارکرد ماه و محاسبه حقوق',c?'ماه قطعی است و از Snapshot خوانده می‌شود.':'فیلتر براساس پرسنل و وضعیت پرداخت.',c?`<button class="btn" onclick="showPayrollClosure()">سند قطعی</button> <button class="btn btn-danger" onclick="reopenPayrollMonth()">بازگشایی</button>`:`<button class="btn btn-success" onclick="finalizePayrollMonth()">✓ قطعی‌کردن حقوق ماه</button>`);return base+`<div class="card"><div class="filter-grid"><div class="field"><label>سال</label><input type="number" value="${f.year}" onchange="ui.payroll.year=+this.value;renderView()"></div><div class="field"><label>ماه</label><select onchange="ui.payroll.month=+this.value;renderView()">${state.lists.months.map((x,i)=>`<option value="${i+1}" ${i+1===f.month?'selected':''}>${x}</option>`).join('')}</select></div><div class="field"><label>پرسنل</label><select onchange="ui.payroll.personnelId=this.value;renderView()">${allPersonOptions(f.personnelId,true)}</select></div><div class="field"><label>وضعیت پرداخت</label><select onchange="ui.payroll.status=this.value;renderView()"><option value="">همه</option>${['تسویه‌شده','پرداخت ناقص','پرداخت‌نشده'].map(x=>`<option ${f.status===x?'selected':''}>${x}</option>`).join('')}</select></div></div>${c?`<div class="closed-banner">🔒 نهایی‌شده توسط <b>${esc(c.finalizedBy||'—')}</b></div>`:''}</div><div class="card"><div class="table-wrap"><table class="data-table"><thead><tr><th>پرسنل</th><th>مانده قبل</th><th>جریمه</th><th>تشویقی</th><th>مساعده</th><th>پرداختی</th><th>ساعت</th><th>تأخیر</th><th>نرخ</th><th>انعام</th><th>خالص</th><th>مانده</th><th>وضعیت</th><th></th></tr></thead><tbody>${rows.map(r=>`<tr><td>${esc(r.personnelCode&&r.personnelName?`${r.personnelCode} | ${r.personnelName}`:personLabel(r.personnelId))}</td><td>${money(r.previousBalance)}</td><td>${money(r.penalty)}</td><td>${money(r.reward)}</td><td>${money(r.advance)}</td><td>${money(r.paid)}</td><td>${dec(r.hours)}</td><td>${dec(r.delayHours)}</td><td>${money(r.hourly)}</td><td>${money(r.tips)}</td><td>${money(r.netToman)}</td><td>${money(r.unpaid)}</td><td>${badge(r.status)}</td><td>${c?badge('قفل'):`<button class="btn btn-sm" onclick="editMonthlyAdjustment('${r.personnelId}')">ورودی دستی</button>`}</td></tr>`).join('')||'<tr><td colspan="14" class="empty">رکوردی پیدا نشد.</td></tr>'}</tbody></table></div></div>`}

function forecastSalaryV5(year,month){return activePersonnel().reduce((sum,p)=>{const prof=salaryProfileOf(p);prof.calculationMonth=month;const est=salaryCompute(prof).totalMonthly;return sum+(est||n(p.hourlyRate)*n(salaryScheduleHours(prof.schedule,month).monthlyHours)+n(p.fixedAllowance)+n(p.transportMonthly))},0)}
const viewsReportsV4=viewsReports;viewsReports=function(){const h=viewsReportsV4(),t=parseJDate(todayJ()),next=t.m===12?{year:t.y+1,month:1}:{year:t.y,month:t.m+1},forecast=`<div class="grid grid-2"><div class="card kpi"><div class="label">پیش‌بینی حقوق ماه جاری — ${monthName(t.m)}</div><div class="value">${money(forecastSalaryV5(t.y,t.m))}</div><div class="sub">براساس پروفایل حقوق و طول ماه</div></div><div class="card kpi"><div class="label">پیش‌بینی حقوق ماه آینده — ${monthName(next.month)}</div><div class="value">${money(forecastSalaryV5(next.year,next.month))}</div><div class="sub">براساس پروفایل فعال پرسنل</div></div></div>`;return h.replace(/(<div class="card"><div class="toolbar">)/,forecast+'$1')}

const viewsSettingsV4=viewsSettings;viewsSettings=function(){let h=viewsSettingsV4();const card=`<div class="card"><div class="section-head"><div><h2>تنظیمات مرخصی</h2><p class="muted">مانده طلب مرخصی از تاریخ مبنا تا ماه جاری محاسبه می‌شود.</p></div><button class="btn btn-primary" onclick="saveLeaveSettingsV5()">ذخیره</button></div><div class="form-grid"><div class="field"><label>تاریخ شروع محاسبه</label><input id="leave_start_v5" value="${esc(state.settings.leaveBalanceStartDate||'1405/05/01')}"></div><div class="field"><label>استحقاق ماهانه (روز)</label><input id="leave_monthly_v5" type="number" step="0.1" value="${n(state.settings.monthlyLeaveEntitlementDays)||2.5}"></div></div></div>`;return h+card}
function saveLeaveSettingsV5(){if(!parseJDate($('leave_start_v5').value))return toast('تاریخ مبنای مرخصی معتبر نیست',true);state.settings.leaveBalanceStartDate=$('leave_start_v5').value;state.settings.monthlyLeaveEntitlementDays=n($('leave_monthly_v5').value)||2.5;commit('ویرایش تنظیمات مرخصی')}

const finalizePayrollMonthV4=finalizePayrollMonth;finalizePayrollMonth=function(){const y=ui.payroll.year,m=ui.payroll.month;if(payrollClosure(y,m))return toast('این ماه قبلاً قطعی شده است',true);openForm(`قطعی‌کردن حقوق ${monthName(m)} ${y}`,[{name:'finalizedBy',label:'نهایی‌کننده'},{name:'notes',label:'توضیحات سند قطعی',type:'textarea',full:true}],{finalizedBy:currentAuthUserV5||'',notes:''},async o=>{if(!o.finalizedBy)throw Error('نام نهایی‌کننده را وارد کنید');const people=payrollPeopleForPeriod(y,m),rows=people.map(p=>({...calcPayrollLive(p,y,m,{}),personnelName:p.name,personnelCode:p.id,personnelSection:p.section||'',personnelPosition:p.mainPosition||''})),payments=structuredClone(state.payments.filter(x=>Number(x.salaryYear)===Number(y)&&Number(x.salaryMonth)===Number(m))),closure={id:uid('PCL',state.payrollClosures),year:y,month:m,version:(state.payrollClosures.filter(x=>x.year===y&&x.month===m).length+1),active:true,finalizedAt:new Date().toISOString(),finalizedBy:o.finalizedBy,notes:o.notes,rows,payments,totals:{netToman:rows.reduce((s,x)=>s+n(x.netToman),0),paid:rows.reduce((s,x)=>s+n(x.paid)+n(x.advance),0),unpaid:rows.reduce((s,x)=>s+n(x.unpaid),0)}};state.payrollClosures.push(closure);closeModal();await commit(`قطعی‌کردن حقوق ${monthName(m)} ${y}`)})};

/* V5.1 corrections: preserve full payroll view, compatible shift pickers, selected-month salary model */
salaryWeeksForMonthV5=function(month){month=n(month)||n(state.salaryModel.draft.calculationMonth)||parseJDate(todayJ()).m;return month<=6?n(state.salaryModel.weeksPerMonthFirstHalf)||4.429:n(state.salaryModel.weeksPerMonthSecondHalf)||4.286};
salaryLegalHourly=function(month){const den=n(state.salaryModel.standardWeeklyHours)*salaryWeeksForMonthV5(month);return den>0?salaryRound(n(state.salaryModel.laborMonthlyBase)/den):0};
salaryScheduleHours=function(sc,month){month=n(month)||n(state.salaryModel.draft.calculationMonth)||parseJDate(todayJ()).m;const h=state.salaryModel.workHours,weeks=salaryWeeksForMonthV5(month),weekly=SALARY_SCHEDULE_KEYS.reduce((sum,k)=>sum+n(sc?.[k])*n(h[k]),0),days=SALARY_SCHEDULE_KEYS.reduce((sum,k)=>sum+n(sc?.[k]),0),night=n(sc?.weekdayEvening)+n(sc?.thursdayEvening)+n(sc?.fridayEvening)+n(sc?.fullWeekday)+n(sc?.fullThursday)+n(sc?.fullFriday);return{weeklyHours:weekly,monthlyHours:weekly*weeks,monthlyDays:days*weeks,nightTrips:night*weeks,weeksPerMonth:weeks}};
salarySaveProfile=async function(applyRate=false){const d=salaryCalcRead(),p=person(d.personnelId);if(!p)return toast('ابتدا پرسنل را انتخاب کنید',true);p.mainPosition=d.position;p.gradeId=d.grade;p.experienceMonths=d.experienceMonths;p.salaryProfile={position:d.position,grade:d.grade,experienceMonths:d.experienceMonths,schedule:{...d.schedule},returnAid:d.returnAid,incentive:d.incentive,contractMonthly:d.contractMonthly,calculationMonth:d.calculationMonth,updatedAt:new Date().toISOString()};if(applyRate)p.hourlyRate=salaryCompute(d).hourly;await commit(applyRate?'ذخیره مدل و اعمال نرخ ساعتی به پرسنل':'ذخیره پروفایل محاسبه حقوق پرسنل');toast(applyRate?'نرخ پیشنهادی در پرونده پرسنل ثبت شد':'پروفایل محاسبه حقوق ذخیره شد')};
function groupForSectionV5(section){return groupForSectionV51(section)}
function compatiblePeopleV5(section,position,selected){const group=groupForSectionV5(section),set=selected||new Set();return activePersonnel().filter(p=>p.personnelGroup===group||set.has(p.id)).sort((a,b)=>{const score=x=>((x.section===section)?0:4)+((x.mainPosition===position)?0:(x.backupPosition===position)?1:3);return score(a)-score(b)||a.name.localeCompare(b.name,'fa')})}
openShiftPicker=function(sectionEncoded,positionEncoded,dayIndex,shift){const section=decodeURIComponent(sectionEncoded||''),position=decodeURIComponent(positionEncoded||'');shiftPickerContext={section,position,dayIndex,shift};const plan=getPlan(ui.shiftWeekStart),selected=new Set(planCellIds(plan,section,position,dayIndex,shift)),group=groupForSectionV5(section),people=compatiblePeopleV5(section,position,selected);$('modalTitle').textContent=`انتخاب پرسنل — ${section} / ${position} / ${state.lists.weekdays[dayIndex]} / ${shift}`;$('modalBody').innerHTML=`<div class="taxonomy-note">فقط نیروهای گروه «${group}» نمایش داده می‌شوند. پوزیشن اصلی یا بک‌آپ مرتبط در ابتدای فهرست است.</div><div class="field full" style="margin-top:10px"><label>جست‌وجو</label><input id="multiSearch" oninput="filterMultiList(this.value)" placeholder="نام یا کد پرسنلی"></div><div class="multi-list" id="multiList">${people.map(x=>`<label class="multi-row" data-search="${esc((x.id+' '+x.name+' '+x.section+' '+x.mainPosition+' '+x.backupPosition).toLowerCase())}"><input type="checkbox" value="${x.id}" ${selected.has(x.id)?'checked':''}><span><b>${esc(x.name)}</b><br><small>${x.id} — ${esc(x.section)} — ${esc(x.mainPosition)}${x.backupPosition?' / بک‌آپ '+esc(x.backupPosition):''}</small></span><span>${x.section===section&&(x.mainPosition===position||x.backupPosition===position)?badge('مرتبط'):''}</span></label>`).join('')}</div>`;$('modalFoot').innerHTML=`<button class="btn" onclick="closeModal()">انصراف</button><button class="btn btn-primary" onclick="saveShiftPicker()">ثبت انتخاب‌ها</button>`;$('modalBackdrop').classList.add('open')};
openMonthlyShiftPicker=function(sectionEncoded,positionEncoded,date,shift){const section=decodeURIComponent(sectionEncoded||''),position=decodeURIComponent(positionEncoded||''),pr=periodOf(date),plan=getMonthlyPlan(pr.year,pr.month),selected=new Set(monthlyPlanCellIds(plan,date,section,position,shift)),group=groupForSectionV5(section),people=compatiblePeopleV5(section,position,selected);monthlyShiftPickerContext={section,position,date,shift};$('modalTitle').textContent=`انتخاب پرسنل — ${date} / ${section} / ${position} / ${shift}`;$('modalBody').innerHTML=`<div class="taxonomy-note">فقط نیروهای گروه «${group}» نمایش داده می‌شوند.</div><div class="field full" style="margin-top:10px"><label>جست‌وجو</label><input id="multiSearch" oninput="filterMultiList(this.value)" placeholder="نام یا کد پرسنلی"></div><div class="multi-list" id="multiList">${people.map(x=>`<label class="multi-row" data-search="${esc((x.id+' '+x.name+' '+x.section+' '+x.mainPosition+' '+x.backupPosition).toLowerCase())}"><input type="checkbox" value="${x.id}" ${selected.has(x.id)?'checked':''}><span><b>${esc(x.name)}</b><br><small>${x.id} — ${esc(x.section)} — ${esc(x.mainPosition)}</small></span><span>${x.section===section&&(x.mainPosition===position||x.backupPosition===position)?badge('مرتبط'):''}</span></label>`).join('')}</div>`;$('modalFoot').innerHTML=`<button class="btn" onclick="closeModal()">انصراف</button><button class="btn btn-primary" onclick="saveMonthlyShiftPicker()">ثبت انتخاب‌ها</button>`;$('modalBackdrop').classList.add('open')};
viewsPayroll=function(){const y=ui.payroll.year,m=ui.payroll.month,c=payrollClosure(y,m),allRows=payrollRowsForPeriod(y,m),rows=allRows.filter(r=>(!ui.payroll.personnelId||r.personnelId===ui.payroll.personnelId)&&(!ui.payroll.status||r.status===ui.payroll.status)),actions=c?`<button class="btn" onclick="showPayrollClosure()">مشاهده سند قطعی</button> <button class="btn btn-danger" onclick="reopenPayrollMonth()">بازگشایی ماه</button>`:`<button class="btn btn-success" onclick="finalizePayrollMonth()">✓ قطعی‌کردن حقوق ماه</button>`;return pageHead('کارکرد ماه و محاسبه حقوق',c?'این ماه قطعی است و اعداد از Snapshot ذخیره‌شده خوانده می‌شوند.':'مقادیر رویدادی از انعام، جریمه، پرداخت، مصرف و تأخیر خودکار جمع می‌شوند.',actions)+`<div class="card"><div class="filter-grid"><div class="field"><label>سال</label><input type="number" value="${y}" onchange="ui.payroll.year=+this.value;renderView()"></div><div class="field"><label>ماه</label><select onchange="ui.payroll.month=+this.value;renderView()">${state.lists.months.map((x,i)=>`<option value="${i+1}" ${i+1===m?'selected':''}>${x}</option>`).join('')}</select></div><div class="field"><label>پرسنل</label><select onchange="ui.payroll.personnelId=this.value;renderView()">${allPersonOptions(ui.payroll.personnelId,true)}</select></div><div class="field"><label>وضعیت</label><select onchange="ui.payroll.status=this.value;renderView()"><option value="">همه</option>${['تسویه‌شده','پرداخت ناقص','پرداخت‌نشده'].map(x=>`<option ${ui.payroll.status===x?'selected':''}>${x}</option>`).join('')}</select></div></div>${c?`<div class="closed-banner"><span class="lock-icon">🔒</span> نهایی‌شده توسط <b>${esc(c.finalizedBy||'—')}</b> در ${esc(new Date(c.finalizedAt).toLocaleString('fa-IR'))}. پرداخت‌های همان زمان داخل سند ذخیره شده‌اند.</div>`:'<div class="hint">بعد از کنترل ساعت‌ها، کسورات و پرداخت‌ها، ماه را قطعی کنید.</div>'}</div><div class="card"><div class="table-wrap"><table class="data-table"><thead><tr><th>پرسنل</th><th>مانده قبل</th><th>جریمه</th><th>تشویقی</th><th>مساعده</th><th>پرداختی</th><th>اعتبار مصرفی</th><th>مانده اعتبار</th><th>مانده غذا</th><th>رفت‌وآمد</th><th>ساعت</th><th>تأخیر</th><th>نرخ ساعتی</th><th>اضافه/کارانه</th><th>حقوق ساعت</th><th>انعام</th><th>ناخالص</th><th>بیمه</th><th>خالص (ریال)</th><th>مانده پرداخت</th><th>وضعیت</th><th></th></tr></thead><tbody>${rows.map(r=>`<tr><td>${esc(r.personnelCode&&r.personnelName?`${r.personnelCode} | ${r.personnelName}`:personLabel(r.personnelId))}</td><td>${money(r.previousBalance)}</td><td>${money(r.penalty)}</td><td>${money(r.reward)}</td><td>${money(r.advance)}</td><td>${money(r.paid)}</td><td>${money(r.creditConsumed)}</td><td>${money(r.creditRemaining)}</td><td>${money(r.mealRemaining)}</td><td>${money(r.transport)}</td><td>${dec(r.hours)}</td><td>${dec(r.delayHours)}</td><td>${money(r.hourly)}</td><td>${money(n(r.overtime)+n(r.fixed)+n(r.otherPayment))}</td><td>${money(r.wage)}</td><td>${money(r.tips)}</td><td>${money(r.gross)}</td><td>${money(r.insurance)}</td><td>${money(r.netRial)}</td><td>${money(r.unpaid)}</td><td>${badge(r.status)}</td><td>${c?'<span class="badge success">قفل</span>':`<button class="btn btn-sm" onclick="editMonthlyAdjustment('${r.personnelId}')">ورودی دستی</button>`}</td></tr>`).join('')||'<tr><td colspan="22" class="empty">رکوردی برای این فیلتر وجود ندارد.</td></tr>'}</tbody></table></div></div>${(()=>{const versions=state.payrollClosures.filter(x=>Number(x.year)===Number(y)&&Number(x.month)===Number(m)).sort((a,b)=>String(b.finalizedAt||'').localeCompare(String(a.finalizedAt||'')));return versions.length?`<div class="card"><div class="section-head"><h2>نسخه‌های ذخیره‌شده این ماه</h2></div><div class="table-wrap"><table class="data-table"><thead><tr><th>نسخه</th><th>زمان نهایی‌سازی</th><th>نهایی‌کننده</th><th>وضعیت</th><th>مانده</th><th></th></tr></thead><tbody>${versions.map(v=>`<tr><td>${v.version}</td><td>${esc(new Date(v.finalizedAt).toLocaleString('fa-IR'))}</td><td>${esc(v.finalizedBy||'—')}</td><td>${v.active!==false?'<span class="badge success">فعال/قطعی</span>':'<span class="badge warn">بازگشایی‌شده</span>'}</td><td>${money(v.totals?.unpaid)}</td><td><button class="btn btn-sm" onclick="showPayrollClosure('${v.id}')">مشاهده</button> <button class="btn btn-sm" onclick="downloadPayrollClosure('${v.id}')">JSON</button></td></tr>`).join('')}</tbody></table></div></div>`:''})()}`};

const viewsPayrollEmploymentBase=viewsPayroll;
viewsPayroll=function(){
 const originalRows=payrollRowsForPeriod,status=ui.payroll.employmentStatus||'فعال';
 payrollRowsForPeriod=(year,month)=>originalRows(year,month).filter(r=>status==='همه'||person(r.personnelId)?.status===status);
 try{
  const statuses=[...new Set(['فعال',...state.personnel.map(p=>p.status).filter(Boolean)])];
  return viewsPayrollEmploymentBase().replace('<div class="filter-grid">',`<div class="filter-grid"><div class="field"><label>وضعیت پرسنل</label><select onchange="ui.payroll.employmentStatus=this.value;renderView()"><option value="همه" ${status==='همه'?'selected':''}>همه پرسنل</option>${statuses.map(x=>`<option value="${esc(x)}" ${status===x?'selected':''}>${esc(x)}</option>`).join('')}</select></div>`).replace('<label>وضعیت</label><select onchange="ui.payroll.status', '<label>وضعیت پرداخت</label><select onchange="ui.payroll.status');
 }finally{payrollRowsForPeriod=originalRows}
};

function payrollNetToman(row){if(row&&row.netToman!==undefined&&row.netToman!==null&&row.netToman!==''&&Number.isFinite(Number(row.netToman)))return n(row.netToman);return n(row?.netRial)/(n(state.settings.tomanToRial)||10)}
function payrollFilteredRows(){const f=ui.payroll,status=f.employmentStatus||'فعال';return payrollRowsForPeriod(f.year,f.month).filter(r=>(status==='همه'||person(r.personnelId)?.status===status)&&(!f.personnelId||r.personnelId===f.personnelId)&&(!f.status||r.status===f.status))}
function showPayrollDetail(personnelId){
 const row=payrollRowsForPeriod(ui.payroll.year,ui.payroll.month).find(r=>r.personnelId===personnelId);if(!row)return toast('جزئیات کارکرد پیدا نشد',true);
 const p=person(personnelId),amounts=[['مانده قبل',row.previousBalance],['جریمه',row.penalty],['تشویقی',row.reward],['مساعده',row.advance],['پرداختی',row.paid],['اعتبار مصرف‌شده',row.creditConsumed],['مانده اعتبار',row.creditRemaining],['مانده غذا',row.mealRemaining],['رفت‌وآمد',row.transport],['نرخ ساعتی',row.hourly],['اضافه‌کار / کارانه',n(row.overtime)+n(row.fixed)+n(row.otherPayment)],['حقوق ساعات کار',row.wage],['انعام',row.tips],['ناخالص',row.gross],['بیمه',row.insurance],['سایر کسورات',row.otherDeduction],['خالص',payrollNetToman(row)],['مانده پرداخت',row.unpaid]];
 $('modalTitle').textContent=`جزئیات کارکرد — ${p?.name||row.personnelName||personnelId}`;
 $('modalBody').innerHTML=`<div class="hint"><b>همه مبالغ به تومان است.</b> دوره: ${monthName(ui.payroll.month)} ${ui.payroll.year}</div><div class="grid grid-3" style="margin-top:12px"><div class="card kpi"><div class="label">ساعت کارکرد</div><div class="value">${dec(row.hours)}</div></div><div class="card kpi"><div class="label">ساعت تأخیر</div><div class="value">${dec(row.delayHours)}</div></div><div class="card kpi"><div class="label">وضعیت پرداخت</div><div class="value" style="font-size:16px">${badge(row.status)}</div></div></div><div class="table-wrap"><table class="data-table" data-no-cell-unit="1"><thead><tr><th>عنوان</th><th>مبلغ</th></tr></thead><tbody>${amounts.map(([label,value])=>`<tr><td>${label}</td><td class="num">${money(value)}</td></tr>`).join('')}</tbody></table></div>${row.notes?`<div class="hint" style="margin-top:12px"><b>توضیحات:</b> ${esc(row.notes)}</div>`:''}`;
 $('modalFoot').innerHTML=`<button class="btn" onclick="closeModal()">بستن</button>${payrollClosure(ui.payroll.year,ui.payroll.month)?'':`<button class="btn btn-primary" onclick="closeModal();editMonthlyAdjustment('${personnelId}')">ویرایش ورودی دستی</button>`}`;$('modalBackdrop').classList.add('open');
}
viewsPayroll=function(){
 const f=ui.payroll,y=f.year,m=f.month,c=payrollClosure(y,m),rows=payrollFilteredRows(),employmentStatus=f.employmentStatus||'فعال',statuses=[...new Set(['فعال',...state.personnel.map(p=>p.status).filter(Boolean)])],actions=c?`<button class="btn" onclick="showPayrollClosure()">مشاهده سند قطعی</button> <button class="btn btn-danger" onclick="reopenPayrollMonth()">بازگشایی ماه</button>`:`<button class="btn btn-success" onclick="finalizePayrollMonth()">✓ قطعی‌کردن حقوق ماه</button>`;
 return pageHead('کارکرد ماه و محاسبه حقوق',c?'این ماه قطعی است و اعداد از Snapshot ذخیره‌شده خوانده می‌شوند.':'نمای خلاصه کارکرد؛ جزئیات کامل هر نفر از کلید مشاهده در دسترس است.',actions)+`<div class="card"><div class="filter-grid"><div class="field"><label>وضعیت پرسنل</label><select onchange="ui.payroll.employmentStatus=this.value;renderView()"><option value="همه" ${employmentStatus==='همه'?'selected':''}>همه پرسنل</option>${statuses.map(x=>`<option value="${esc(x)}" ${employmentStatus===x?'selected':''}>${esc(x)}</option>`).join('')}</select></div><div class="field"><label>سال</label><input type="number" value="${y}" onchange="ui.payroll.year=+this.value;renderView()"></div><div class="field"><label>ماه</label><select onchange="ui.payroll.month=+this.value;renderView()">${state.lists.months.map((x,i)=>`<option value="${i+1}" ${i+1===m?'selected':''}>${x}</option>`).join('')}</select></div><div class="field"><label>پرسنل</label><select onchange="ui.payroll.personnelId=this.value;renderView()">${allPersonOptions(f.personnelId,true)}</select></div><div class="field"><label>وضعیت پرداخت</label><select onchange="ui.payroll.status=this.value;renderView()"><option value="">همه</option>${['تسویه‌شده','پرداخت ناقص','پرداخت‌نشده'].map(x=>`<option ${f.status===x?'selected':''}>${x}</option>`).join('')}</select></div></div><div class="hint"><b>همه مبالغ این جدول به تومان است.</b></div>${c?`<div class="closed-banner"><span class="lock-icon">🔒</span> نهایی‌شده توسط <b>${esc(c.finalizedBy||'—')}</b> در ${esc(new Date(c.finalizedAt).toLocaleString('fa-IR'))}.</div>`:''}</div><div class="card"><div class="table-wrap"><table class="data-table" data-no-cell-unit="1"><thead><tr><th>پرسنل</th><th>ساعت</th><th>تأخیر</th><th>نرخ ساعتی</th><th>حقوق کارکرد</th><th>خالص</th><th>مانده پرداخت</th><th>وضعیت</th><th></th></tr></thead><tbody>${rows.map(r=>`<tr><td>${esc(r.personnelCode&&r.personnelName?`${r.personnelCode} | ${r.personnelName}`:personLabel(r.personnelId))}</td><td>${dec(r.hours)}</td><td>${dec(r.delayHours)}</td><td class="num">${money(r.hourly)}</td><td class="num">${money(r.wage)}</td><td class="num">${money(payrollNetToman(r))}</td><td class="num">${money(r.unpaid)}</td><td>${badge(r.status)}</td><td><button class="btn btn-sm" onclick="showPayrollDetail('${r.personnelId}')">مشاهده</button></td></tr>`).join('')||'<tr><td colspan="9" class="empty">رکوردی برای این فیلتر وجود ندارد.</td></tr>'}</tbody></table></div></div>${(()=>{const versions=state.payrollClosures.filter(x=>Number(x.year)===Number(y)&&Number(x.month)===Number(m)).sort((a,b)=>String(b.finalizedAt||'').localeCompare(String(a.finalizedAt||'')));return versions.length?`<div class="card"><div class="section-head"><h2>نسخه‌های ذخیره‌شده این ماه</h2></div><div class="table-wrap"><table class="data-table"><thead><tr><th>نسخه</th><th>زمان نهایی‌سازی</th><th>نهایی‌کننده</th><th>وضعیت</th><th>مانده</th><th></th></tr></thead><tbody>${versions.map(v=>`<tr><td>${v.version}</td><td>${esc(new Date(v.finalizedAt).toLocaleString('fa-IR'))}</td><td>${esc(v.finalizedBy||'—')}</td><td>${v.active!==false?'<span class="badge success">فعال/قطعی</span>':'<span class="badge warn">بازگشایی‌شده</span>'}</td><td>${money(v.totals?.unpaid)}</td><td><button class="btn btn-sm" onclick="showPayrollClosure('${v.id}')">مشاهده</button> <button class="btn btn-sm" onclick="downloadPayrollClosure('${v.id}')">JSON</button></td></tr>`).join('')}</tbody></table></div></div>`:''})()}`;
};
window.showPayrollDetail=showPayrollDetail;

/* ==================== END V5 OVERRIDES ==================== */

const A=x=>Array.isArray(x)?x:[];
const TIP_QUERY_COLLECTION='tipGroups',TIP_ID_FIELD='id',TIP_DATE_FIELD='receiveDate',TIP_AMOUNT_FIELD='totalAmount';
const tipGatewayState={referencesReady:false,referencesPromise:null,loading:false,submitting:false,error:null,rows:[],cache:new Map(),pendingMutation:null,pendingArchives:new Map(),availableYears:new Set()};
function tipCurrentYear(){return parseJDate(todayJ())?.y||1405}
function tipNormalizeYear(value){const digits=normalizeDigits(String(value??'')).replace(/\D/g,''),year=Number(digits);return year>=1200&&year<=1700?year:0}
function tipEnsureSelectedYear(){if(!tipNormalizeYear(ui.tipFilter.year))ui.tipFilter.year=String(tipCurrentYear());return tipNormalizeYear(ui.tipFilter.year)}
function tipYearOptions(){const current=tipCurrentYear(),selected=tipEnsureSelectedYear(),years=new Set([current,selected,...tipGatewayState.availableYears]);A(tipGatewayState.rows).forEach(g=>{const y=periodOf(g.receiveDate).year;if(y)years.add(y)});return [...years].filter(Boolean).sort((a,b)=>b-a).map(y=>`<option value="${y}" ${y===selected?'selected':''}>${y.toLocaleString('fa-IR',{useGrouping:false})}</option>`).join('')}
function tipQueryRange(){const year=tipEnsureSelectedYear(),month=Number(ui.tipFilter.month)||0;if(!year)return{from:'',to:''};return{from:month?jDate(year,month,1):jDate(year,1,1),to:month?jDate(year,month,jMonthLength(year,month)):jDate(year,12,jMonthLength(year,12))}}
function tipQueryFilters(){const f=ui.tipFilter,filters={};if(f.type)filters.type=f.type;if(f.status)filters.status=f.status;return filters}
function tipQueryKey(){const r=tipQueryRange(),f=tipQueryFilters();return JSON.stringify({f,r,personnelId:ui.tipFilter.personnelId||''})}
async function tipQueryAll(collection,options={}){const pageSize=500,first=await RAYO_API_GATEWAY.queryCollection({module:'personnel',collection,page:1,pageSize,...options}),items=[...first.items];for(let page=2;page<=first.totalPages;page++){const next=await RAYO_API_GATEWAY.queryCollection({module:'personnel',collection,page,pageSize,...options});items.push(...next.items)}return items}
async function tipLoadReferences(){if(tipGatewayState.referencesReady)return;if(tipGatewayState.referencesPromise)return tipGatewayState.referencesPromise;tipGatewayState.referencesPromise=(async()=>{const full=await RAYO_API_GATEWAY.loadModule('hr'),listPaths=['tipTypes','hallGroups','paymentMethods','tipStatuses','settlementMethods','months'];if(!full||!Array.isArray(full.personnel)||!full.lists)throw Error('فهرست‌های مرجع فرم انعام از سرور دریافت نشد');const missing=listPaths.filter(name=>!Array.isArray(full.lists[name])||!full.lists[name].length);if(missing.length)throw Error(`فهرست‌های ضروری فرم انعام خالی است: ${missing.join('، ')}`);state=migrate(full);window.__RAYO_HR_SERVER_CONFIRMED__=RAYO_API_GATEWAY.getModuleStatus?.('hr')?.initialized===true;tipGatewayState.referencesReady=true})().finally(()=>{tipGatewayState.referencesPromise=null});return tipGatewayState.referencesPromise}
function tipRowsLocal(rows){const f=ui.tipFilter;return rows.filter(g=>{const p=periodOf(g.receiveDate),participants=Array.isArray(g.participants)?g.participants:[];return(!f.year||p.year===Number(f.year))&&(!f.month||p.month===Number(f.month))&&(!f.type||g.type===f.type)&&(!f.status||g.status===f.status)&&(!f.personnelId||participants.some(x=>x.personnelId===f.personnelId))}).sort((a,b)=>dateCode(b.receiveDate)-dateCode(a.receiveDate))}
async function tipRefresh({force=false,render=true}={}){tipEnsureSelectedYear();const key=tipQueryKey();tipGatewayState.loading=true;tipGatewayState.error=null;if(render)renderView();try{await tipLoadReferences();let rows=!force&&tipGatewayState.cache.get(key);if(!rows){const all=await tipQueryAll(TIP_QUERY_COLLECTION,{sortBy:TIP_DATE_FIELD,descending:true,includeArchived:false});state.tipGroups=all;all.forEach(g=>{const y=periodOf(g.receiveDate).year;if(y)tipGatewayState.availableYears.add(y)});rows=tipRowsLocal(all);tipGatewayState.cache.set(key,rows)}tipGatewayState.rows=rows;$('saveStatus').textContent=`انعام‌ها از Query دریافت شد — ${new Date().toLocaleTimeString('fa-IR')}`;return rows}catch(error){tipGatewayState.error=error;$('saveStatus').textContent='خطا در دریافت انعام — این بخش فقط‌خواندنی است';if(render)toast(error.message||'دریافت انعام انجام نشد',true);throw error}finally{tipGatewayState.loading=false;if(render)renderView()}}
async function ensureTipGateway(){if(tipGatewayState.loading||tipGatewayState.error||tipGatewayState.rows.length||tipGatewayState.cache.has(tipQueryKey()))return;try{await tipRefresh()}catch(_){}}
async function tipFilterChanged(key,value){ui.tipFilter[key]=key==='year'?String(tipNormalizeYear(value)||tipCurrentYear()):value;try{await tipRefresh()}catch(_){}}
function tipSelectedAmounts(g){const pid=ui.tipFilter.personnelId;if(!pid)return{total:g.status==='ابطال‌شده'?0:n(g.totalAmount),settled:effectiveSettled(g)};const share=tipShares(g).find(x=>x.personnelId===pid)?.amount||0,ratio=n(g.totalAmount)>0?share/n(g.totalAmount):0;return{total:g.status==='ابطال‌شده'?0:share,settled:effectiveSettled(g)*ratio}}
function tipRowProjection(g,personnelId=ui.tipFilter.personnelId){const shares=tipShares(g),visibleShares=personnelId?shares.filter(x=>x.personnelId===personnelId):shares;return{record:g,shares:visibleShares,amounts:tipSelectedAmounts(g)}}
viewsTips=function(){if(!tipGatewayState.referencesReady&&!tipGatewayState.loading&&!tipGatewayState.error)void ensureTipGateway();tipEnsureSelectedYear();const f=ui.tipFilter,rows=tipGatewayState.rows.map(g=>tipRowProjection(g)),total=rows.reduce((s,x)=>s+x.amounts.total,0),settled=rows.reduce((s,x)=>s+x.amounts.settled,0),disabled=tipGatewayState.loading||tipGatewayState.submitting||!!tipGatewayState.error?'disabled':'';return pageHead('انعام و تقسیم سهم','انعام فردی، سالن یا کلی ثبت می‌شود و سهم افراد خودکار محاسبه می‌شود.',`<button class="btn btn-primary" ${disabled} onclick="editTip()">+ ثبت انعام</button>`)+(tipGatewayState.error?`<div class="card"><div class="notice danger">${esc(tipGatewayState.error.message||'دریافت اطلاعات انعام انجام نشد. این بخش فقط‌خواندنی است.')}</div><button class="btn" onclick="tipRetryQuery()">تلاش مجدد</button></div>`:'')+`<div class="card"><div class="filter-grid"><div class="field"><label>سال تعلق انعام</label><select onchange="tipFilterChanged('year',this.value)">${tipYearOptions()}</select></div><div class="field"><label>ماه</label><select onchange="tipFilterChanged('month',this.value)"><option value="">همه ماه‌ها</option>${A(state.lists.months).map((x,i)=>`<option value="${i+1}" ${String(f.month)===String(i+1)?'selected':''}>${x}</option>`).join('')}</select></div><div class="field"><label>پرسنل</label><select onchange="tipFilterChanged('personnelId',this.value)">${allPersonOptions(f.personnelId,true)}</select></div><div class="field"><label>نوع</label><select onchange="tipFilterChanged('type',this.value)"><option value="">همه</option>${A(state.lists.tipTypes).map(x=>`<option ${f.type===x?'selected':''}>${x}</option>`).join('')}</select></div><div class="field"><label>وضعیت</label><select onchange="tipFilterChanged('status',this.value)"><option value="">همه</option>${A(state.lists.tipStatuses).map(x=>`<option ${f.status===x?'selected':''}>${x}</option>`).join('')}</select></div></div></div>${tipGatewayState.loading?'<div class="card empty">در حال دریافت فهرست‌ها و انعام‌ها…</div>':`<div class="grid grid-3"><div class="card kpi"><div class="label">جمع فیلترشده</div><div class="value">${money(total)}</div></div><div class="card kpi"><div class="label">تسویه‌شده</div><div class="value">${money(settled)}</div></div><div class="card kpi"><div class="label">مانده</div><div class="value">${money(total-settled)}</div></div></div><div class="card"><div class="table-wrap"><table class="data-table"><thead><tr><th>تاریخ</th><th>نوع</th><th>مبلغ</th><th>افراد و سهم</th><th>تسویه</th><th>وضعیت</th><th></th></tr></thead><tbody>${rows.map(x=>{const g=x.record;return`<tr><td>${esc(g.receiveDate)}</td><td>${badge(g.type)}</td><td>${money(x.amounts.total)}</td><td>${x.shares.map(s=>`${esc(person(s.personnelId)?.name||s.personnelId)}: <b>${money(s.amount)}</b>`).join('<br>')}</td><td>${money(x.amounts.settled)}</td><td>${badge(g.status)}</td><td><button class="btn btn-sm" onclick="editTip('${esc(g.id)}')">ویرایش</button> <button class="btn btn-danger btn-sm" onclick="archiveTipRecord('${esc(g.id)}')">آرشیو</button></td></tr>`}).join('')||'<tr><td colspan="7" class="empty">داده با موفقیت دریافت شد، اما برای فیلترهای انتخاب‌شده انعامی وجود ندارد.</td></tr>'}</tbody></table></div></div>`}`}
async function tipRetryQuery(){tipGatewayState.error=null;tipGatewayState.cache.delete(tipQueryKey());try{await tipRefresh({force:true})}catch(_){}}
function tipMutationDraft(id){const date=$('tip_date').value;if(!parseJDate(date)){toast('تاریخ معتبر وارد کنید',true);return null}const total=n($('tip_total').value),participants=qsa('#tipPeople .multi-row').filter(r=>qs('input[type=checkbox]',r).checked).map(r=>({personnelId:qs('input[type=checkbox]',r).value,weight:n(qs('input[type=number]',r).value)||1}));if(total<=0||!participants.length){toast('مبلغ و حداقل یک نفر الزامی است',true);return null}return{receiveDate:date,type:$('tip_type').value,totalAmount:total,receiveMethod:$('tip_receive').value,status:$('tip_status').value,settledAmount:n($('tip_settled').value),settlementDate:$('tip_settle_date').value,settlementMethod:$('tip_settle_method').value,notes:$('tip_notes').value,participants}}
saveTip=async function(id){if(tipGatewayState.submitting||tipGatewayState.loading||tipGatewayState.error)return;const data=tipMutationDraft(id);if(!data)return;const fingerprint=JSON.stringify({id,data});let pending=tipGatewayState.pendingMutation;if(!pending||pending.fingerprint!==fingerprint){pending={fingerprint,requestId:RAYO_API_GATEWAY.createRequestId(),recordId:id||`TIPG-${data.receiveDate.replace(/\D/g,'')}-${RAYO_API_GATEWAY.createRequestId()}`,createdAt:new Date().toISOString()};tipGatewayState.pendingMutation=pending}const button=$('tipMutationSave')||$('modalFoot')?.querySelector('.btn-primary');tipGatewayState.submitting=true;if(button){button.disabled=true;button.textContent='در حال ثبت…'}try{await RAYO_API_GATEWAY.mutateRecord({module:'personnel',collection:TIP_QUERY_COLLECTION,operation:id?'update':'insert',recordId:pending.recordId,idField:TIP_ID_FIELD,requestId:pending.requestId,data:id?data:{id:pending.recordId,...data,createdAt:pending.createdAt}});tipGatewayState.pendingMutation=null;tipGatewayState.cache.clear();await tipRefresh({force:true,render:false});closeModal();renderView();toast(id?'انعام ویرایش شد':'انعام ثبت شد')}catch(error){pending.requestId=RAYO_API_GATEWAY.createRequestId();if(error.code==='version_conflict'){toast('اطلاعات انعام هم‌زمان تغییر کرده است؛ فرم شما حفظ شد.',true);if(confirm('نسخه جدید انعام‌ها دریافت شود؟ اطلاعات واردشده فرم حفظ خواهد شد.')){tipGatewayState.cache.clear();try{await tipRefresh({force:true,render:false})}catch(_){}}}else toast(error.message||'ثبت انعام انجام نشد؛ فرم حفظ شد و تلاش بعدی شناسه درخواست تازه خواهد داشت.',true)}finally{tipGatewayState.submitting=false;if(button){button.disabled=false;button.textContent='ذخیره'}}}
const editTipQueryBase=editTip;function tipReferenceErrorModal(id,error){$('modalTitle').textContent='بارگذاری فرم انعام';$('modalBody').innerHTML=`<div class="notice danger">${esc(error?.message||'فهرست‌های فرم انعام دریافت نشد.')}</div><p class="muted">هیچ مقدار پیش‌فرضی ذخیره نشده است.</p>`;$('modalFoot').innerHTML=`<button class="btn" onclick="closeModal()">بستن</button><button class="btn btn-primary" onclick="editTip('${esc(id||'')}')">تلاش مجدد</button>`;$('modalBackdrop').classList.add('open')}
editTip=async function(id){if(tipGatewayState.submitting)return;if(!tipGatewayState.referencesReady){$('modalTitle').textContent='ثبت انعام';$('modalBody').innerHTML='<div class="empty">در حال دریافت فهرست‌های فرم انعام…</div>';$('modalFoot').innerHTML='<button class="btn" onclick="closeModal()">انصراف</button>';$('modalBackdrop').classList.add('open');try{await tipLoadReferences()}catch(error){tipReferenceErrorModal(id,error);return}}if(tipGatewayState.error)return tipReferenceErrorModal(id,tipGatewayState.error);editTipQueryBase(id);const button=$('modalFoot')?.querySelector('.btn-primary');if(button){button.id='tipMutationSave';button.disabled=tipGatewayState.submitting}}
async function archiveTipRecord(id){if(tipGatewayState.loading||tipGatewayState.submitting||tipGatewayState.error||!confirm('این انعام آرشیو شود؟ حذف فیزیکی انجام نخواهد شد.'))return;let requestId=tipGatewayState.pendingArchives.get(id);if(!requestId){requestId=RAYO_API_GATEWAY.createRequestId();tipGatewayState.pendingArchives.set(id,requestId)}tipGatewayState.submitting=true;renderView();try{await RAYO_API_GATEWAY.mutateRecord({module:'personnel',collection:TIP_QUERY_COLLECTION,operation:'archive',recordId:id,idField:TIP_ID_FIELD,requestId,data:{isArchived:true,archivedAt:new Date().toISOString()}});tipGatewayState.pendingArchives.delete(id);tipGatewayState.cache.clear();await tipRefresh({force:true}) ;toast('انعام آرشیو شد')}catch(error){tipGatewayState.pendingArchives.set(id,RAYO_API_GATEWAY.createRequestId());if(error.code==='version_conflict'){toast('نسخه اطلاعات تغییر کرده است؛ آرشیو انجام نشد.',true);if(confirm('نسخه جدید انعام‌ها دریافت شود؟')){tipGatewayState.cache.clear();try{await tipRefresh({force:true})}catch(_){}}}else toast(error.message||'آرشیو انجام نشد؛ تلاش بعدی شناسه درخواست تازه خواهد داشت.',true)}finally{tipGatewayState.submitting=false;renderView()}}
Object.assign(window,{tipGatewayState,tipFilterChanged,tipRetryQuery,archiveTipRecord,ensureTipGateway});

const views={dashboard:viewsDashboard,personnel:viewsPersonnel,staffingNeeds:viewsStaffingNeeds,staffingMap:viewsStaffingMap,annualCalendar:viewsAnnualCalendar,monthlyShiftPlan:viewsMonthlyShiftPlan,shiftPlan:viewsShiftPlan,shiftHistory:viewsShiftHistory,shiftReport:viewsShiftReport,payroll:viewsPayroll,salaryCalculator:viewsSalaryCalculator,salaryPersonnel:viewsSalaryPersonnel,salaryRates:viewsSalaryRates,salarySettings:viewsSalarySettings,payslip:viewsPayslip,tips:viewsTips,penalties:viewsPenalties,delays:viewsDelays,payments:viewsPayments,consumption:viewsConsumption,leaves:viewsLeaves,reports:viewsReports,settings:viewsSettings,changelog:viewsChangelog};
init();
