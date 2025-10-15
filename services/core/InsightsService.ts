import { useModel } from '@/services/database/BaseModel';
import { tables } from '@/services/database/migrations/v1/schema_v1';
import { TrackResponseModel } from '@/services/database/models/TrackResponseModel';
import { DateBasedInsightRequest, DateBasedInsightResponse, InsightTopicRequest, InsightTopicResponse } from '@/services/common/types';
import insightsConfig from '@/services/config/insights.json';
import { logger } from '@/services/logging/logger';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, format, parse, addDays, startOfQuarter, endOfQuarter, addMonths } from 'date-fns';

// Single shared instance of model
const trackResponseModel = new TrackResponseModel();

//Converts MM-DD-YYYY format to YYYY-MM-DD format
const convertDateFormat = (dateStr: string): string => {
    if (dateStr.includes('-') && dateStr.split('-')[0].length === 2) {
        const [month, day, year] = dateStr.split('-');
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    return dateStr;
};

// Helper function to get date range based on frequency
const getDateRange = (selectedDate: string) => {
    const date = parse(selectedDate, 'yyyy-MM-dd', new Date());

    // For daily items: get the week range (Mon-Sun)
    const weekStart = startOfWeek(date, { weekStartsOn: 1 }); // 1 represents Monday
    const weekEnd = endOfWeek(date, { weekStartsOn: 1 });

    // For weekly items: get the month range to show all Mondays
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);

    // For monthly items: get the quarter range
    const quarterStart = startOfQuarter(date);
    const quarterEnd = endOfQuarter(date);

    return {
        daily: {
            start: format(weekStart, 'yyyy-MM-dd'),
            end: format(weekEnd, 'yyyy-MM-dd')
        },
        weekly: {
            start: format(monthStart, 'yyyy-MM-dd'),
            end: format(monthEnd, 'yyyy-MM-dd')
        },
        monthly: {
            start: format(quarterStart, 'yyyy-MM-dd'),
            end: format(quarterEnd, 'yyyy-MM-dd')
        }
    };
};

// Helper function to format data points based on frequency
const formatDataPoints = (data: any[], frequency: 'daily' | 'weekly' | 'monthly', startDate: Date) => {
    const result = [];

    switch (frequency) {
        case 'daily':
            // Show week trend (Mon-Sun)
            for (let i = 0; i < 7; i++) {
                const currentDate = addDays(startOfWeek(startDate, { weekStartsOn: 1 }), i);
                const dateStr = format(currentDate, 'yyyy-MM-dd');
                const dataPoint = data.find(d => d.date === dateStr);

                result.push({
                    label: format(currentDate, 'EEE'),
                    date: dateStr,
                    value: dataPoint ? dataPoint.value : 0
                });
            }
            return result;

        case 'weekly':
            // Show all Mondays in the month
            let currentDate = startOfMonth(startDate);
            const monthEnd = endOfMonth(startDate);

            while (currentDate <= monthEnd) {
                if (format(currentDate, 'EEEE') === 'Monday') {
                    const dateStr = format(currentDate, 'yyyy-MM-dd');
                    const dataPoint = data.find(d => d.date === dateStr);

                    result.push({
                        label: format(currentDate, 'MMM d'),
                        date: dateStr,
                        value: dataPoint ? dataPoint.value : 0
                    });
                }
                currentDate = addDays(currentDate, 1);
            }
            return result;

        case 'monthly':
            // Show current month and previous 2 months (3 months total)
            const currentMonth = startOfMonth(startDate);
            for (let i = 0; i < 3; i++) {
                // Start from 2 months ago and move forward to current month
                const monthDate = addMonths(currentMonth, -2 + i);
                const dateStr = format(monthDate, 'yyyy-MM-dd');
                const dataPoint = data.find(d => d.date === dateStr);

                result.push({
                    label: format(monthDate, 'MMM d'),
                    date: dateStr,
                    value: dataPoint ? dataPoint.value : 0
                });
            }
            return result;
    }
};

export const getAllDateBasedInsights = async (
    patientId: string,
    selectedDate: string
): Promise<DateBasedInsightResponse[]> => {
    return useModel(trackResponseModel, async (model: any) => {
        logger.debug('getAllDateBasedInsights called', { patientId, selectedDate });

        const allInsights: DateBasedInsightResponse[] = [];

        // First, get all available insight topics for this patient using getInsightTopics
        const availableTopics = await getInsightTopics({ patientId });
        logger.debug('Available insight topics', { availableTopics });

        // Then, filter to only include items tracked on the selected date
        const trackedItemsOnDate = await model.runQuery(
            `SELECT DISTINCT ti.code 
             FROM ${tables.TRACK_ITEM} ti 
             INNER JOIN ${tables.TRACK_ITEM_ENTRY} tie ON ti.id = tie.track_item_id 
             WHERE tie.patient_id = ? AND (tie.date = ? OR tie.date LIKE ?) AND tie.selected = 1`,
            [patientId, selectedDate, `%${selectedDate.split('-')[1]}-${selectedDate.split('-')[2]}-${selectedDate.split('-')[0]}`]
        );

        logger.debug('Tracked items on selected date', { trackedItemsOnDate });

        // Create a set of tracked item codes for faster lookup
        const trackedItemCodes = new Set(trackedItemsOnDate.map((item: any) => item.code));

        // Process each available insight topic, but only if it was tracked on the selected date
        for (const topic of availableTopics) {
            try {
                // Skip insights that weren't tracked on the selected date
                if (!trackedItemCodes.has(topic.insightKey)) {
                    logger.debug(`Skipping insight ${topic.insightName} - not tracked on ${selectedDate}`);
                    continue;
                }

                // Find the corresponding insight config
                const insightConfig = insightsConfig.find(config => config.insightKey === topic.insightKey);
                if (!insightConfig) {
                    logger.debug(`No config found for insight ${topic.insightName}`);
                    continue;
                }

                const insightRequest: DateBasedInsightRequest = {
                    patientId,
                    selectedDate,
                    insightKey: topic.insightKey,
                    questionCode: insightConfig.questionCode
                };

                const insightData = await getDateBasedInsights(insightRequest);
                if (insightData && insightData.series && insightData.series.length > 0) {
                    allInsights.push(insightData);
                }
            } catch (error) {
                logger.debug(`Error fetching insight ${topic.insightName}`, { error });
                // Continue with other insights even if one fails
            }
        }

        return allInsights;
    });
};

export const getDateBasedInsights = async (
    request: DateBasedInsightRequest
): Promise<DateBasedInsightResponse> => {
    return useModel(trackResponseModel, async (model: any) => {
        logger.debug('getDateBasedInsights called', { request });

        // Get the question ID and insight configuration
        const question = await model.runQuery(
            `SELECT q.id, q.type, ti.id as topic_id, ti.name as topic_name
             FROM ${tables.QUESTION} q 
             INNER JOIN ${tables.TRACK_ITEM} ti ON q.item_id = ti.id
             WHERE q.code = ? AND ti.code = ?`,
            [request.questionCode, request.insightKey]
        );

        logger.debug('Question query result', { question });

        if (!question || question.length === 0) {
            throw new Error('Question not found for the given insight');
        }

        const questionId = question[0].id;
        const questionType = question[0].type;
        const topicId = question[0].topic_id;
        const topicName = question[0].topic_name;

        // Get date ranges for different frequencies
        const dateRanges = getDateRange(request.selectedDate);
        logger.debug('Date ranges calculated', { dateRanges });

        // Get the insight configuration
        const insightConfig = insightsConfig.find(
            config => config.insightKey === request.insightKey
        );

        if (!insightConfig) {
            throw new Error('Insight configuration not found');
        }

        // Fetch data for the longest range (quarterly for monthly items)
        const allData = await model.runQuery(
            `SELECT tie.date, tr.answer 
             FROM ${tables.TRACK_RESPONSE} tr 
             INNER JOIN ${tables.TRACK_ITEM_ENTRY} tie ON tr.track_item_entry_id = tie.id 
             WHERE tr.patient_id = ? 
             AND tr.question_id = ? 
             ORDER BY tie.date DESC
             LIMIT 30`,
            [request.patientId, questionId]
        );

        logger.debug('Raw data fetched', { allData });

        // Process the raw data
        const processedData = allData.map((row: any) => {
            let value = 0;
            try {
                const answerValue = typeof row.answer === 'string' ?
                    JSON.parse(row.answer) : row.answer;
                value = questionType === 'boolean' ?
                    (answerValue ? 1 : 0) :
                    (parseInt(answerValue) || 0);
            } catch (e) {
                value = questionType === 'boolean' ?
                    (row.answer ? 1 : 0) :
                    (parseInt(row.answer) || 0);
            }

            return {
                date: convertDateFormat(row.date),
                value
            };
        });

        logger.debug('Processed data', { processedData });

        // Construct the response based on tracking frequency
        const series = [];
        const selectedDate = parse(request.selectedDate, 'yyyy-MM-dd', new Date());

        // For daily tracking items, show weekly trend
        if (insightConfig.frequencies.includes('daily')) {
            const weeklyTrend = formatDataPoints(
                processedData,
                'daily',
                selectedDate
            );
            series.push({
                questionId,
                transform: questionType,
                topicId,
                topic: `${topicName} (Weekly Trend)`,
                data: weeklyTrend
            });
        }

        // For weekly tracking items, show monthly trend (Mondays)
        if (insightConfig.frequencies.includes('weekly')) {
            const monthlyTrend = formatDataPoints(
                processedData,
                'weekly',
                selectedDate
            );
            series.push({
                questionId,
                transform: questionType,
                topicId,
                topic: `${topicName} (Monthly Trend)`,
                data: monthlyTrend
            });
        }

        // For monthly tracking items, show quarterly trend
        if (insightConfig.frequencies.includes('monthly')) {
            const quarterlyTrend = formatDataPoints(
                processedData,
                'monthly',
                selectedDate
            );
            series.push({
                questionId,
                transform: questionType,
                topicId,
                topic: `${topicName} (Quarterly Trend)`,
                data: quarterlyTrend
            });
        }

        // Determine the appropriate date range based on the insight's frequency
        let startDate = dateRanges.daily.start;
        let endDate = dateRanges.daily.end;
        
        if (insightConfig.frequencies.includes('monthly')) {
            startDate = dateRanges.monthly.start;
            endDate = dateRanges.monthly.end;
        } else if (insightConfig.frequencies.includes('weekly')) {
            startDate = dateRanges.weekly.start;
            endDate = dateRanges.weekly.end;
        }
        
        logger.debug('getDateBasedInsights response', {
            startDate,
            endDate,
            frequency: insightConfig.frequencies[0],
            series
        });

        return {
            startDate,
            endDate,
            series
        };
    });
};

export const getInsightTopics = async (
    request: InsightTopicRequest
): Promise<InsightTopicResponse[]> => {
    return useModel(trackResponseModel, async (model: any) => {
        // Get all active track items that the patient has selected
        const selectedItems = await model.runQuery(
            `SELECT ti.id, ti.code, ti.status 
             FROM ${tables.TRACK_ITEM} ti 
             INNER JOIN ${tables.TRACK_ITEM_ENTRY} tie ON ti.id = tie.track_item_id 
             WHERE tie.patient_id = ? AND ti.status = 'active' AND tie.selected = 1`,
            [request.patientId]
        );

        // Get all questions of numeric or boolean type
        const insightQuestions = await model.runQuery(
            `SELECT q.id, q.code, q.type, q.item_id 
             FROM ${tables.QUESTION} q 
             WHERE q.type IN ('numeric', 'boolean')`,
            []
        );

        // Map of track item codes to their associated questions suitable for insights
        const trackItemQuestionsMap = new Map();

        // Populate the map with selected track items and their insight-suitable questions
        selectedItems.forEach((item: any) => {
            const itemQuestions = insightQuestions.filter(
                (q: any) => q.item_id === item.id
            );
            if (itemQuestions.length > 0) {
                trackItemQuestionsMap.set(item.code, itemQuestions);
            }
        });

        // Filter insights from config based on available track items and questions
        const availableInsights: InsightTopicResponse[] = [];

        insightsConfig.forEach((insight: any) => {
            const trackItemCode = insight.insightKey;
            const questionCode = insight.questionCode;

            // Check if this track item is selected by the patient and has the required question
            if (trackItemQuestionsMap.has(trackItemCode)) {
                const questions = trackItemQuestionsMap.get(trackItemCode);
                const matchingQuestion = questions.find((q: any) => q.code === questionCode);

                if (matchingQuestion) {
                    availableInsights.push({
                        insightName: insight.insightName,
                        insightKey: insight.insightKey
                    });
                }
            }
        });

        return availableInsights;
    });
};