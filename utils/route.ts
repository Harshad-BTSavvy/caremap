export const ROUTE_PREFIX = {
  PUBLIC: "/public",
  AUTH: "/auth",
  HOME: "/home",
  MY_HEALTH: "/home/myHealth",
  MEDICAL_OVERVIEW: "/home/myHealth/medicalOverview",
  MEDICAL_HISTORY: "/home/myHealth/medicalHistory" as const,
  TRACK: "/home/track" as const,
} as const;

export const ROUTES = {
  LAUNCH: `${ROUTE_PREFIX.PUBLIC}/launch` as const,
  ONBOARDING: `${ROUTE_PREFIX.PUBLIC}/onboarding` as const,
  LOGIN: `${ROUTE_PREFIX.AUTH}/login` as const,
  MY_HEALTH: `${ROUTE_PREFIX.MY_HEALTH}` as const,
  EDIT_PROFILE: `${ROUTE_PREFIX.MY_HEALTH}/profile/editProfile` as const,

  MEDICAL_OVERVIEW: `${ROUTE_PREFIX.MEDICAL_OVERVIEW}` as const,
  SNAPSHOT: `${ROUTE_PREFIX.MEDICAL_OVERVIEW}/(medicalTabs)/snapshot` as const,
  MEDICAL_CONDITIONS:
    `${ROUTE_PREFIX.MEDICAL_OVERVIEW}/(medicalTabs)/medicalCondition` as const,
 
  EMERGENCY_CARE: `${ROUTE_PREFIX.MY_HEALTH}/emergencyCare` as const,
  MEDICATIONS: `${ROUTE_PREFIX.MY_HEALTH}/medications` as const,
  NOTES: `${ROUTE_PREFIX.MY_HEALTH}/notes` as const,
  ALLERGIES: `${ROUTE_PREFIX.MY_HEALTH}/allergies` as const,
  MEDICAL_EQUIPMENTS: `${ROUTE_PREFIX.MY_HEALTH}/medicalEquipments` as const,
  HIGH_LEVEL_GOALS: `${ROUTE_PREFIX.MY_HEALTH}/highLevelGoals` as const,
  MEDICAL_HISTORY: `${ROUTE_PREFIX.MEDICAL_HISTORY}` as const,
  HOSPITALIZATION:
    `${ROUTE_PREFIX.MEDICAL_HISTORY}/(medicalHistoryTabs)/hospitalization` as const,
  SURGERIES_AND_PROCEDURES:
    `${ROUTE_PREFIX.MEDICAL_HISTORY}/(medicalHistoryTabs)/surgeriesAndProcedures` as const,
  POST_DISCHARGE_INSTRUCTIONS:
    `${ROUTE_PREFIX.MEDICAL_HISTORY}/(medicalHistoryTabs)/postDischargeInstructions` as const,
  COMING_SOON: `${ROUTE_PREFIX.MY_HEALTH}/comingSoon/page` as const,

  TRACK_ADD_ITEM: `${ROUTE_PREFIX.TRACK}/addItem` as const,
  TRACK_CUSTOM_GOALS: `${ROUTE_PREFIX.TRACK}/customGoals` as const,
  TRACK_QUESTIONS: `${ROUTE_PREFIX.TRACK}/questions/[itemId]` as const,
  TRACK_CUSTOM_GOALS_ADD_QUESTIONS:
    `${ROUTE_PREFIX.TRACK}/customGoals/addQuestions` as const,
} as const;

export type AppRoutes = keyof typeof ROUTES;
