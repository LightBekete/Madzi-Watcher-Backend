import WaterQualityData from "../models/WaterQualityData.mjs";
import { buildDateFilter } from "../utils/dateFilters.mjs";


/*
|--------------------------------------------------------------------------
| getDashboardStatistics
|--------------------------------------------------------------------------
| This controller provides a summary of the most important statistics
| for the admin dashboard.
|
| Expected operations:
| - Compute average (mean) values of key parameters (pH, TDS, turbidity,
|   electrical conductivity, WQI).
| - Compute standard deviation or variance for stability insight.
| - Retrieve latest readings.
| - Return insights such as safe ranges and water quality interpretation.
|
| Purpose:
| Allows the Qt dashboard to quickly display overall water system health.
*/
export const getDashboardStatistics = async (req, res, next) => {          
    try {
        const stats = await WaterQualityData.aggregate([
            {
                $group: {
                    _id: null,
                    // Mean values
                    meanPH: { $avg: "$pH" },
                    meanTDS: { $avg: "$tds" },
                    meanTurbidity: { $avg: "$turbidity" },
                    meanConductivity: { $avg: "$electricalConductivity" },
                    meanWQI: { $avg: "$waterQualityIndex" },
                    
                    // Standard deviation calculations
                    stdDevPH: { $stdDevPop: "$pH" },
                    stdDevTDS: { $stdDevPop: "$tds" },
                    stdDevTurbidity: { $stdDevPop: "$turbidity" },
                    stdDevConductivity: { $stdDevPop: "$electricalConductivity" },
                    stdDevWQI: { $stdDevPop: "$waterQualityIndex" },
                    
                    // Min values
                    minPH: { $min: "$pH" },
                    minTDS: { $min: "$tds" },
                    minTurbidity: { $min: "$turbidity" },
                    minConductivity: { $min: "$electricalConductivity" },
                    minWQI: { $min: "$waterQualityIndex" },
                    
                    // Max values
                    maxPH: { $max: "$pH" },
                    maxTDS: { $max: "$tds" },
                    maxTurbidity: { $max: "$turbidity" },
                    maxConductivity: { $max: "$electricalConductivity" },
                    maxWQI: { $max: "$waterQualityIndex" },
                    
                    // Count for WQI classification
                    count: { $sum: 1 }
                }
            }
        ]);

        // Get latest reading
        const latestReading = await WaterQualityData.findOne()
            .sort({ createdAt: -1 })
            .limit(1);

        // Determine WQI classification
        let wqiClassification = "No Data";
        if (stats.length > 0) {
            const avgWQI = stats[0].meanWQI;
            if (avgWQI <= 50) wqiClassification = "Excellent";
            else if (avgWQI <= 100) wqiClassification = "Good";
            else if (avgWQI <= 200) wqiClassification = "Poor";
            else wqiClassification = "Unsafe";
        }

        // Format response
        const response = {
            mean: {
                pH: stats[0]?.meanPH || null,
                tds: stats[0]?.meanTDS || null,
                turbidity: stats[0]?.meanTurbidity || null,
                electricalConductivity: stats[0]?.meanConductivity || null,
                wqi: stats[0]?.meanWQI || null
            },
            stdDev: {
                pH: stats[0]?.stdDevPH || null,
                tds: stats[0]?.stdDevTDS || null,
                turbidity: stats[0]?.stdDevTurbidity || null,
                electricalConductivity: stats[0]?.stdDevConductivity || null,
                wqi: stats[0]?.stdDevWQI || null
            },
            min: {
                pH: stats[0]?.minPH || null,
                tds: stats[0]?.minTDS || null,
                turbidity: stats[0]?.minTurbidity || null,
                electricalConductivity: stats[0]?.minConductivity || null,
                wqi: stats[0]?.minWQI || null
            },
            max: {
                pH: stats[0]?.maxPH || null,
                tds: stats[0]?.maxTDS || null,
                turbidity: stats[0]?.maxTurbidity || null,
                electricalConductivity: stats[0]?.maxConductivity || null,
                wqi: stats[0]?.maxWQI || null
            },
            latestReading: latestReading || null,
            wqiClassification: wqiClassification,
            totalReadings: stats[0]?.count || 0
        };

        return res.status(200).json({
            status: "success",
            message: "Dashboard statistics retrieved successfully",
            data: response
        });
    }                                               
    catch (error) {
        next(error);
    }                       
} 


/*
|--------------------------------------------------------------------------
| getWaterQualityHistory
|--------------------------------------------------------------------------
| Returns historical water quality data collected by the ESP32 sensors.
|
| Expected operations:
| - Retrieve all stored sensor records from MongoDB.
| - Return time-series data containing pH, TDS, turbidity,
|   electrical conductivity, and WQI.
|
| Purpose:
| Allows administrators to view the full history of water quality
| measurements for analysis and visualization (graphs, charts).
*/
export const getWaterQualityHistory = async (req, res, next) => {
    try {
        const { limit = 100, skip = 0, startDate, endDate } = req.query;

        let query = {};

        // Add date range filtering if provided
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        const history = await WaterQualityData.find(query)
            .sort({ createdAt: -1 })
            .skip(parseInt(skip))
            .limit(parseInt(limit))
            .lean();

        const totalCount = await WaterQualityData.countDocuments(query);

        if (history.length === 0) {
            return res.status(404).json({
                status: "failed",
                message: "No water quality history found"
            });
        }

        return res.status(200).json({
            status: "success",
            message: "Water quality history data retrieved successfully",
            data: {
                readings: history,
                pagination: {
                    total: totalCount,
                    limit: parseInt(limit),
                    skip: parseInt(skip),
                    hasMore: totalCount > (parseInt(skip) + history.length)
                }
            }
        });
    }
    catch (error) {
        next(error);
    }
}


/*
|--------------------------------------------------------------------------
| getMeanStatistics
|--------------------------------------------------------------------------
| Calculates the average (mean) value for each water quality parameter.
|
| Expected operations:
| - Compute mean values for:
|     pH
|     TDS
|     turbidity
|     electrical conductivity
|     Water Quality Index
|
| Purpose:
| Provides a general overview of typical water conditions
| across all sensor measurements.
*/
export const getMeanStatistics = async (req, res, next) => {
    try {

        const { 
            period = 'all',
            startDate,
            endDate 
        } = req.query;

        // Build the date filter
        const dateFilter = buildDateFilter(period, startDate, endDate);

        const meanStats = await WaterQualityData.aggregate([
            {
                $match: dateFilter
            },
            {
                $group: {
                    _id: null,
                    pH: { $avg: "$pH" },
                    tds: { $avg: "$tds" },
                    turbidity: { $avg: "$turbidity" },
                    electricalConductivity: { $avg: "$electricalConductivity" },
                    waterQualityIndex: { $avg: "$waterQualityIndex" }
                }
            }
        ]);

        if (!meanStats || meanStats.length === 0) {
            return res.status(404).json({
                status: "failed",
                message: "No data available for mean statistics in the selected period"
            });
        }

        const totalReadings = await WaterQualityData.countDocuments(dateFilter);

        return res.status(200).json({
            status: "success",
            message: `Mean statistics calculated successfully for period: ${period}`,
            data: {
                ...meanStats[0],
                totalReadings,
                appliedFilter: { period, startDate, endDate }
            }
        });
    } catch (error) {
        next(error);
    }
};


/*
|--------------------------------------------------------------------------
| getVarianceStatistics
|--------------------------------------------------------------------------
| Computes the statistical variance for each water quality parameter.
|
| Expected operations:
| - Measure how much readings vary from the average.
| - Use MongoDB aggregation to calculate variance.
|
| Purpose:
| Helps identify unstable or fluctuating water quality conditions.
*/
export const getVarianceStatistics = async (req, res, next) => {
    try {

         const { 
            period = 'all',
            startDate,
            endDate 
        } = req.query;

        // Build the date filter
        const dateFilter = buildDateFilter(period, startDate, endDate);
        const varianceStats = await WaterQualityData.aggregate([
            {
                $match: dateFilter
            },
            {
                $group: {
                    _id: null,
                    pHVariance: { $stdDevPop: "$pH" },
                    tdsVariance: { $stdDevPop: "$tds" },
                    turbidityVariance: { $stdDevPop: "$turbidity" },
                    conductivityVariance: { $stdDevPop: "$electricalConductivity" },
                    wqiVariance: { $stdDevPop: "$waterQualityIndex" }
                }
            },
            {
                $project: {
                    pH: { $pow: ["$pHVariance", 2] },
                    tds: { $pow: ["$tdsVariance", 2] },
                    turbidity: { $pow: ["$turbidityVariance", 2] },
                    electricalConductivity: { $pow: ["$conductivityVariance", 2] },
                    waterQualityIndex: { $pow: ["$wqiVariance", 2] }
                }
            }
        ]);

        if (varianceStats.length === 0) {
            return res.status(404).json({
                status: "failed",
                message: "No data available for variance statistics"
            });
        }

        return res.status(200).json({
            status: "success",
            message: "Variance statistics calculated successfully",
            data: varianceStats[0]
        });
    }
    catch (error) {
        next(error);
    }
}


/*
|--------------------------------------------------------------------------
| getStandardDeviationStatistics
|--------------------------------------------------------------------------
| Calculates standard deviation for each parameter.
|
| Expected operations:
| - Determine how far measurements typically deviate
|   from the mean value.
|
| Purpose:
| Indicates water quality stability or variability
| within the monitoring system.
*/
export const getStandardDeviationStatistics = async (req, res, next) => {
    try {

         const { 
            period = 'all',
            startDate,
            endDate 
        } = req.query;

        // Build the date filter
        const dateFilter = buildDateFilter(period, startDate, endDate);
        const stdDevStats = await WaterQualityData.aggregate([
            {
                $match: dateFilter
            },
            {
                $group: {
                    _id: null,
                    pH: { $stdDevPop: "$pH" },
                    tds: { $stdDevPop: "$tds" },
                    turbidity: { $stdDevPop: "$turbidity" },
                    electricalConductivity: { $stdDevPop: "$electricalConductivity" },
                    waterQualityIndex: { $stdDevPop: "$waterQualityIndex" }
                }
            }
        ]);

        if (stdDevStats.length === 0) {
            return res.status(404).json({
                status: "failed",
                message: "No data available for standard deviation statistics"
            });
        }

        return res.status(200).json({
            status: "success",
            message: "Standard deviation statistics calculated successfully",
            data: stdDevStats[0]
        });
    } catch (error) {
        next(error);
    }
};


/*
|--------------------------------------------------------------------------
| getMedianStatistics
|--------------------------------------------------------------------------
| Calculates the median (middle value) of sensor readings.
|
| Expected operations:
| - Sort values and return the middle reading.
|
| Purpose:
| Provides a more reliable measure of typical conditions
| when outliers exist.
*/
export const getMedianStatistics = async (req, res, next) => {
    try {

         const { 
            period = 'all',
            startDate,
            endDate 
        } = req.query;

        // Build the date filter
        const dateFilter = buildDateFilter(period, startDate, endDate);
        const getAllValues = async (field) => {
            const values = await WaterQualityData.find(dateFilter, { [field]: 1, _id: 0 })
                .sort({ [field]: 1 })
                .lean();
            return values.map(v => v[field]).filter(v => v !== null && v !== undefined);
        };

        const [phValues, tdsValues, turbidityValues, conductivityValues, wqiValues] = await Promise.all([
            getAllValues('pH'),
            getAllValues('tds'),
            getAllValues('turbidity'),
            getAllValues('electricalConductivity'),
            getAllValues('waterQualityIndex')
        ]);

        const calculateMedian = (arr) => {
            if (arr.length === 0) return null;
            const mid = Math.floor(arr.length / 2);
            return arr.length % 2 !== 0 ? arr[mid] : (arr[mid - 1] + arr[mid]) / 2;
        };

        const medianStats = {
            pH: calculateMedian(phValues),
            tds: calculateMedian(tdsValues),
            turbidity: calculateMedian(turbidityValues),
            electricalConductivity: calculateMedian(conductivityValues),
            waterQualityIndex: calculateMedian(wqiValues)
        };

        return res.status(200).json({
            status: "success",
            message: "Median statistics calculated successfully",
            data: medianStats
        });
    } catch (error) {
        next(error);
    }
};


/*
|--------------------------------------------------------------------------
| getMinMaxStatistics
|--------------------------------------------------------------------------
| Finds the minimum and maximum values recorded by sensors.
|
| Expected operations:
| - Identify lowest and highest values for each parameter.
|
| Purpose:
| Helps detect extreme pollution events or abnormal sensor readings.
*/
export const getMinMaxStatistics = async (req, res, next) => {
    try {

         const { 
            period = 'all',
            startDate,
            endDate 
        } = req.query;

        // Build the date filter
        const dateFilter = buildDateFilter(period, startDate, endDate);
        const minMaxStats = await WaterQualityData.aggregate([
            {
                $match: dateFilter
            },
            {
                $group: {
                    _id: null,
                    minPH: { $min: "$pH" },
                    maxPH: { $max: "$pH" },
                    minTDS: { $min: "$tds" },
                    maxTDS: { $max: "$tds" },
                    minTurbidity: { $min: "$turbidity" },
                    maxTurbidity: { $max: "$turbidity" },
                    minConductivity: { $min: "$electricalConductivity" },
                    maxConductivity: { $max: "$electricalConductivity" },
                    minWQI: { $min: "$waterQualityIndex" },
                    maxWQI: { $max: "$waterQualityIndex" }
                }
            },
            {
                $project: {
                    pH: { min: "$minPH", max: "$maxPH" },
                    tds: { min: "$minTDS", max: "$maxTDS" },
                    turbidity: { min: "$minTurbidity", max: "$maxTurbidity" },
                    electricalConductivity: { min: "$minConductivity", max: "$maxConductivity" },
                    waterQualityIndex: { min: "$minWQI", max: "$maxWQI" }
                }
            }
        ]);

        if (minMaxStats.length === 0) {
            return res.status(404).json({
                status: "failed",
                message: "No data available for min/max statistics"
            });
        }

        return res.status(200).json({
            status: "success",
            message: "Min/Max statistics calculated successfully",
            data: minMaxStats[0]
        });
    } catch (error) {
        next(error);
    }
};


/*
|--------------------------------------------------------------------------
| getDailyStatistics
|--------------------------------------------------------------------------
| Aggregates water quality data by day.
|
| Expected operations:
| - Group sensor readings by day.
| - Calculate daily averages for parameters.
|
| Purpose:
| Enables visualization of daily water quality trends.
*/
export const getDailyStatistics = async (req, res, next) => {
    try {
        const { days = 30 } = req.query;

        const dailyStats = await WaterQualityData.aggregate([
            {
                $match: {
                    createdAt: { $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" },
                        day: { $dayOfMonth: "$createdAt" }
                    },
                    date: { $first: "$createdAt" },
                    avgPH: { $avg: "$pH" },
                    avgTDS: { $avg: "$tds" },
                    avgTurbidity: { $avg: "$turbidity" },
                    avgConductivity: { $avg: "$electricalConductivity" },
                    avgWQI: { $avg: "$waterQualityIndex" },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 }
            },
            {
                $project: {
                    _id: 0,
                    date: {
                        $dateToString: { format: "%Y-%m-%d", date: "$date" }
                    },
                    avgPH: 1,
                    avgTDS: 1,
                    avgTurbidity: 1,
                    avgConductivity: 1,
                    avgWQI: 1,
                    readings: "$count"
                }
            }
        ]);

        return res.status(200).json({
            status: "success",
            message: "Daily statistics retrieved successfully",
            data: dailyStats
        });
    } catch (error) {
        next(error);
    }
};


/*
|--------------------------------------------------------------------------
| getWeeklyStatistics
|--------------------------------------------------------------------------
| Aggregates water quality data by week.
|
| Expected operations:
| - Group readings by week.
| - Compute weekly averages.
|
| Purpose:
| Helps monitor treatment plant performance weekly.
*/
export const getWeeklyStatistics = async (req, res, next) => {
    try {
        const { weeks = 12 } = req.query;

        const weeklyStats = await WaterQualityData.aggregate([
            {
                $match: {
                    createdAt: { $gte: new Date(Date.now() - weeks * 7 * 24 * 60 * 60 * 1000) }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        week: { $week: "$createdAt" }
                    },
                    weekStart: {
                        $min: {
                            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
                        }
                    },
                    weekEnd: {
                        $max: {
                            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
                        }
                    },
                    avgPH: { $avg: "$pH" },
                    avgTDS: { $avg: "$tds" },
                    avgTurbidity: { $avg: "$turbidity" },
                    avgConductivity: { $avg: "$electricalConductivity" },
                    avgWQI: { $avg: "$waterQualityIndex" },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { "_id.year": -1, "_id.week": -1 }
            },
            {
                $project: {
                    _id: 0,
                    week: {
                        start: "$weekStart",
                        end: "$weekEnd"
                    },
                    avgPH: 1,
                    avgTDS: 1,
                    avgTurbidity: 1,
                    avgConductivity: 1,
                    avgWQI: 1,
                    readings: "$count"
                }
            }
        ]);

        return res.status(200).json({
            status: "success",
            message: "Weekly statistics retrieved successfully",
            data: weeklyStats
        });
    } catch (error) {
        next(error);
    }
};


/*
|--------------------------------------------------------------------------
| getMonthlyStatistics
|--------------------------------------------------------------------------
| Aggregates water quality measurements per month.
|
| Expected operations:
| - Group readings by month.
| - Compute average values for parameters.
|
| Purpose:
| Allows long-term trend analysis and seasonal pattern detection.
*/
export const getMonthlyStatistics = async (req, res, next) => {
    try {
        const { months = 12 } = req.query;

        const monthlyStats = await WaterQualityData.aggregate([
            {
                $match: {
                    createdAt: { $gte: new Date(Date.now() - months * 30 * 24 * 60 * 60 * 1000) }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" }
                    },
                    month: {
                        $first: {
                            $dateToString: { format: "%Y-%m", date: "$createdAt" }
                        }
                    },
                    avgPH: { $avg: "$pH" },
                    avgTDS: { $avg: "$tds" },
                    avgTurbidity: { $avg: "$turbidity" },
                    avgConductivity: { $avg: "$electricalConductivity" },
                    avgWQI: { $avg: "$waterQualityIndex" },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { "_id.year": -1, "_id.month": -1 }
            },
            {
                $project: {
                    _id: 0,
                    month: 1,
                    avgPH: 1,
                    avgTDS: 1,
                    avgTurbidity: 1,
                    avgConductivity: 1,
                    avgWQI: 1,
                    readings: "$count"
                }
            }
        ]);

        return res.status(200).json({
            status: "success",
            message: "Monthly statistics retrieved successfully",
            data: monthlyStats
        });
    } catch (error) {
        next(error);
    }
};


/*
|--------------------------------------------------------------------------
| getYearlyStatistics
|--------------------------------------------------------------------------
| Aggregates water quality statistics per year.
|
| Expected operations:
| - Group sensor data by year.
| - Calculate yearly averages.
|
| Purpose:
| Enables long-term monitoring of water system performance.
*/
export const getYearlyStatistics = async (req, res, next) => {
    try {
        const yearlyStats = await WaterQualityData.aggregate([
            {
                $group: {
                    _id: { year: { $year: "$createdAt" } },
                    year: { $first: { $year: "$createdAt" } },
                    avgPH: { $avg: "$pH" },
                    avgTDS: { $avg: "$tds" },
                    avgTurbidity: { $avg: "$turbidity" },
                    avgConductivity: { $avg: "$electricalConductivity" },
                    avgWQI: { $avg: "$waterQualityIndex" },
                    minWQI: { $min: "$waterQualityIndex" },
                    maxWQI: { $max: "$waterQualityIndex" },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { year: -1 }
            },
            {
                $project: {
                    _id: 0,
                    year: 1,
                    avgPH: 1,
                    avgTDS: 1,
                    avgTurbidity: 1,
                    avgConductivity: 1,
                    avgWQI: 1,
                    minWQI: 1,
                    maxWQI: 1,
                    readings: "$count"
                }
            }
        ]);

        return res.status(200).json({
            status: "success",
            message: "Yearly statistics retrieved successfully",
            data: yearlyStats
        });
    } catch (error) {
        next(error);
    }
};


/*
|--------------------------------------------------------------------------
| getTrendAnalysis
|--------------------------------------------------------------------------
| Analyzes how water quality parameters change over time.
|
| Expected operations:
| - Identify increasing or decreasing trends
|   in turbidity, pH, TDS, and WQI.
|
| Purpose:
| Helps detect gradual pollution or system degradation.
*/
export const getTrendAnalysis = async (req, res, next) => {
    try {
         const { 
            period = 'all',
            startDate,
            endDate 
        } = req.query;

        // Build the date filter
        const dateFilter = buildDateFilter(period, startDate, endDate) || {};

        const trends = await WaterQualityData.aggregate([
            {
                $match: dateFilter
                
            },
            {
                $sort: { createdAt: 1 }
            },
            {
                $group: {
                    _id: null,
                    firstReading: { $first: "$$ROOT" },
                    lastReading: { $last: "$$ROOT" },
                    readings: { $push: "$$ROOT" }
                }
            },
            {
                $project: {
                    _id: 0,
                    trends: {
                        pH: {
                            start: "$firstReading.pH",
                            end: "$lastReading.pH",
                            change: { $subtract: ["$lastReading.pH", "$firstReading.pH"] },
                            direction: {
                                $cond: {
                                    if: { $gt: [{ $subtract: ["$lastReading.pH", "$firstReading.pH"] }, 0] },
                                    then: "increasing",
                                    else: {
                                        $cond: {
                                            if: { $lt: [{ $subtract: ["$lastReading.pH", "$firstReading.pH"] }, 0] },
                                            then: "decreasing",
                                            else: "stable"
                                        }
                                    }
                                }
                            }
                        },
                        tds: {
                            start: "$firstReading.tds",
                            end: "$lastReading.tds",
                            change: { $subtract: ["$lastReading.tds", "$firstReading.tds"] },
                            direction: {
                                $cond: {
                                    if: { $gt: [{ $subtract: ["$lastReading.tds", "$firstReading.tds"] }, 0] },
                                    then: "increasing",
                                    else: {
                                        $cond: {
                                            if: { $lt: [{ $subtract: ["$lastReading.tds", "$firstReading.tds"] }, 0] },
                                            then: "decreasing",
                                            else: "stable"
                                        }
                                    }
                                }
                            }
                        },
                        turbidity: {
                            start: "$firstReading.turbidity",
                            end: "$lastReading.turbidity",
                            change: { $subtract: ["$lastReading.turbidity", "$firstReading.turbidity"] },
                            direction: {
                                $cond: {
                                    if: { $gt: [{ $subtract: ["$lastReading.turbidity", "$firstReading.turbidity"] }, 0] },
                                    then: "increasing",
                                    else: {
                                        $cond: {
                                            if: { $lt: [{ $subtract: ["$lastReading.turbidity", "$firstReading.turbidity"] }, 0] },
                                            then: "decreasing",
                                            else: "stable"
                                        }
                                    }
                                }
                            }
                        },
                        wqi: {
                            start: "$firstReading.waterQualityIndex",
                            end: "$lastReading.waterQualityIndex",
                            change: { $subtract: ["$lastReading.waterQualityIndex", "$firstReading.waterQualityIndex"] },
                            direction: {
                                $cond: {
                                    if: { $gt: [{ $subtract: ["$lastReading.waterQualityIndex", "$firstReading.waterQualityIndex"] }, 0] },
                                    then: "worsening",
                                    else: {
                                        $cond: {
                                            if: { $lt: [{ $subtract: ["$lastReading.waterQualityIndex", "$firstReading.waterQualityIndex"] }, 0] },
                                            then: "improving",
                                            else: "stable"
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        ]);

        return res.status(200).json({
            status: "success",
            message: "Trend analysis completed successfully",
            data: trends[0] || { trends: {} }
        });
    } catch (error) {
        next(error);
    }
};


/*
|--------------------------------------------------------------------------
| getMovingAverage
|--------------------------------------------------------------------------
| Computes moving averages for sensor readings.
|
| Expected operations:
| - Smooth noisy sensor data.
| - Calculate rolling averages over time windows.
|
| Purpose:
| Helps identify long-term patterns in water quality data.
*/
export const getMovingAverage = async (req, res, next) => {
    try {
        const { window = 7, parameter = "turbidity" } = req.query;

        const validParameters = ["pH", "tds", "turbidity", "electricalConductivity", "waterQualityIndex"];

        if (!validParameters.includes(parameter)) {
            return res.status(400).json({
                status: "failed",
                message: "Invalid parameter. Choose from: " + validParameters.join(", ")
            });
        }

        const data = await WaterQualityData.find({})
            .sort({ createdAt: 1 })
            .select(`${parameter} createdAt`)
            .lean();

        if (data.length < window) {
            return res.status(400).json({
                status: "failed",
                message: `Need at least ${window} data points for moving average`
            });
        }

        const movingAverages = [];
        for (let i = 0; i <= data.length - window; i++) {
            const windowData = data.slice(i, i + window);
            const sum = windowData.reduce((acc, curr) => acc + curr[parameter], 0);
            const avg = sum / window;

            movingAverages.push({
                date: data[i + Math.floor(window / 2)].createdAt,
                value: avg,
                periodStart: windowData[0].createdAt,
                periodEnd: windowData[windowData.length - 1].createdAt
            });
        }

        return res.status(200).json({
            status: "success",
            message: `Moving average calculated for ${parameter}`,
            data: {
                parameter,
                windowSize: parseInt(window),
                movingAverages
            }
        });
    } catch (error) {
        next(error);
    }
};


/*
|--------------------------------------------------------------------------
| getParameterCorrelation
|--------------------------------------------------------------------------
| Computes statistical correlation between parameters.
|
| Expected operations:
| - Determine relationships such as:
|     TDS vs Conductivity
|     Turbidity vs WQI
|     pH vs WQI
|
| Purpose:
| Helps understand which factors influence water quality most.
*/
export const getParameterCorrelation = async (req, res, next) => {
    try {
        const data = await WaterQualityData.find({})
            .select("pH tds turbidity electricalConductivity waterQualityIndex")
            .lean();

        if (data.length < 2) {
            return res.status(400).json({
                status: "failed",
                message: "Insufficient data for correlation analysis"
            });
        }

        const calculateCorrelation = (x, y) => {
            const n = x.length;
            const sumX = x.reduce((a, b) => a + b, 0);
            const sumY = y.reduce((a, b) => a + b, 0);
            const sumXY = x.reduce((acc, val, i) => acc + val * y[i], 0);
            const sumX2 = x.reduce((acc, val) => acc + val * val, 0);
            const sumY2 = y.reduce((acc, val) => acc + val * val, 0);

            const numerator = n * sumXY - sumX * sumY;
            const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

            return denominator === 0 ? 0 : numerator / denominator;
        };

        const pH = data.map(d => d.pH).filter(v => v !== null);
        const tds = data.map(d => d.tds).filter(v => v !== null);
        const turbidity = data.map(d => d.turbidity).filter(v => v !== null);
        const conductivity = data.map(d => d.electricalConductivity).filter(v => v !== null);
        const wqi = data.map(d => d.waterQualityIndex).filter(v => v !== null);

        const correlations = {
            tds_conductivity: calculateCorrelation(tds, conductivity),
            turbidity_wqi: calculateCorrelation(turbidity, wqi),
            pH_wqi: calculateCorrelation(pH, wqi),
            pH_turbidity: calculateCorrelation(pH, turbidity),
            tds_wqi: calculateCorrelation(tds, wqi)
        };

        return res.status(200).json({
            status: "success",
            message: "Parameter correlations calculated successfully",
            data: correlations
        });
    } catch (error) {
        next(error);
    }
};


/*
|--------------------------------------------------------------------------
| detectOutliers
|--------------------------------------------------------------------------
| Identifies abnormal sensor readings.
|
| Expected operations:
| - Use statistical methods (Z-score or deviation threshold)
|   to detect extreme values.
|
| Purpose:
| Helps detect contamination events or sensor malfunction.
*/
export const detectOutliers = async (req, res, next) => {
    try {
        const { threshold = 3, parameter = "turbidity" } = req.query; // Z-score threshold

        const validParameters = ["pH", "tds", "turbidity", "electricalConductivity", "waterQualityIndex"];

        if (!validParameters.includes(parameter)) {
            return res.status(400).json({
                status: "failed",
                message: "Invalid parameter. Choose from: " + validParameters.join(", ")
            });
        }

        const stats = await WaterQualityData.aggregate([
            {
                $group: {
                    _id: null,
                    mean: { $avg: `$${parameter}` },
                    stdDev: { $stdDevPop: `$${parameter}` }
                }
            }
        ]);

        if (stats.length === 0) {
            return res.status(404).json({
                status: "failed",
                message: "No data available for outlier detection"
            });
        }

        const { mean, stdDev } = stats[0];

        const outliers = await WaterQualityData.find({
            [parameter]: {
                $not: {
                    $gte: mean - threshold * stdDev,
                    $lte: mean + threshold * stdDev
                }
            }
        })
        .sort({ createdAt: -1 })
        .limit(100)
        .lean();

        const outlierStats = outliers.map(outlier => ({
            _id: outlier._id,
            value: outlier[parameter],
            zScore: Math.abs((outlier[parameter] - mean) / stdDev),
            deviation: outlier[parameter] - mean,
            percentageDeviation: ((outlier[parameter] - mean) / mean * 100).toFixed(2) + "%",
            timestamp: outlier.createdAt,
            fullReading: outlier
        }));

        return res.status(200).json({
            status: "success",
            message: "Outliers detected successfully",
            data: {
                parameter,
                mean,
                stdDev,
                threshold: parseFloat(threshold),
                outlierCount: outliers.length,
                outliers: outlierStats
            }
        });
    } catch (error) {
        next(error);
    }
};


/*
|--------------------------------------------------------------------------
| getWaterQualityClassification
|--------------------------------------------------------------------------
| Classifies water safety using the Water Quality Index (WQI).
|
| Expected operations:
| - Calculate average WQI.
| - Categorize water quality (Excellent, Good, Poor, Unsafe).
|
| Purpose:
| Provides a simple interpretation of water safety.
*/
export const getWaterQualityClassification = async (req, res, next) => {
    try {
        const classification = await WaterQualityData.aggregate([
            {
                $group: {
                    _id: null,
                    avgWQI: { $avg: "$waterQualityIndex" },
                    minWQI: { $min: "$waterQualityIndex" },
                    maxWQI: { $max: "$waterQualityIndex" },
                    readings: { $sum: 1 }
                }
            },
            {
                $project: {
                    _id: 0,
                    avgWQI: 1,
                    minWQI: 1,
                    maxWQI: 1,
                    readings: 1,
                    classification: {
                        $switch: {
                            branches: [
                                { case: { $lte: ["$avgWQI", 50] }, then: "Excellent" },
                                { case: { $lte: ["$avgWQI", 100] }, then: "Good" },
                                { case: { $lte: ["$avgWQI", 200] }, then: "Poor" }
                            ],
                            default: "Unsafe"
                        }
                    },
                    distribution: {
                        excellent: {
                            $size: {
                                $filter: {
                                    input: { $literal: [] }, // This is a placeholder, we need a different approach
                                    as: "item",
                                    cond: { $lte: ["$$item.waterQualityIndex", 50] }
                                }
                            }
                        }
                    }
                }
            }
        ]);

        // Get distribution separately
        const distribution = await WaterQualityData.aggregate([
            {
                $group: {
                    _id: {
                        $switch: {
                            branches: [
                                { case: { $lte: ["$waterQualityIndex", 50] }, then: "Excellent" },
                                { case: { $lte: ["$waterQualityIndex", 100] }, then: "Good" },
                                { case: { $lte: ["$waterQualityIndex", 200] }, then: "Poor" }
                            ],
                            default: "Unsafe"
                        }
                    },
                    count: { $sum: 1 },
                    avgWQI: { $avg: "$waterQualityIndex" }
                }
            },
            {
                $project: {
                    _id: 0,
                    category: "$_id",
                    count: 1,
                    avgWQI: 1
                }
            }
        ]);

        return res.status(200).json({
            status: "success",
            message: "Water quality classification completed",
            data: {
                overall: classification[0] || null,
                distribution
            }
        });
    } catch (error) {
        next(error);
    }
};


/*
|--------------------------------------------------------------------------
| getWaterStabilityScore
|--------------------------------------------------------------------------
| Measures stability of water quality over time.
|
| Expected operations:
| - Use variance or standard deviation to compute stability score.
|
| Purpose:
| Indicates how consistent the water treatment system is.
*/
export const getWaterStabilityScore = async (req, res, next) => {
    try {
         const { 
            period = 'all',
            startDate,
            endDate 
        } = req.query;

        // Build the date filter
        const dateFilter = buildDateFilter(period, startDate, endDate);
        const stabilityScores = await WaterQualityData.aggregate([
            {
                $match: dateFilter
            },
            {
                $group: {
                    _id: null,
                    phStdDev: { $stdDevPop: "$pH" },
                    tdsStdDev: { $stdDevPop: "$tds" },
                    turbidityStdDev: { $stdDevPop: "$turbidity" },
                    conductivityStdDev: { $stdDevPop: "$electricalConductivity" },
                    wqiStdDev: { $stdDevPop: "$waterQualityIndex" },

                    phMean: { $avg: "$pH" },
                    tdsMean: { $avg: "$tds" },
                    turbidityMean: { $avg: "$turbidity" },
                    conductivityMean: { $avg: "$electricalConductivity" },
                    wqiMean: { $avg: "$waterQualityIndex" }
                }
            },
            {
                $project: {
                    _id: 0,
                    stabilityScore: {
                        overall: {
                            $avg: [
                                { $divide: [1, { $add: [1, "$phStdDev"] }] },
                                { $divide: [1, { $add: [1, { $divide: ["$tdsStdDev", 100] }] }] },
                                { $divide: [1, { $add: [1, "$turbidityStdDev"] }] },
                                { $divide: [1, { $add: [1, { $divide: ["$conductivityStdDev", 100] }] }] },
                                { $divide: [1, { $add: [1, { $divide: ["$wqiStdDev", 20] }] }] }
                            ]
                        },
                        parameters: {
                            pH: { $divide: [1, { $add: [1, "$phStdDev"] }] },
                            tds: { $divide: [1, { $add: [1, { $divide: ["$tdsStdDev", 100] }] }] },
                            turbidity: { $divide: [1, { $add: [1, "$turbidityStdDev"] }] },
                            conductivity: { $divide: [1, { $add: [1, { $divide: ["$conductivityStdDev", 100] }] }] },
                            wqi: { $divide: [1, { $add: [1, { $divide: ["$wqiStdDev", 20] }] }] }
                        }
                    }
                }
            }
        ]);

        // Calculate trend stability (last 30 days vs previous 30 days)
        const now = new Date();
        const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));
        const sixtyDaysAgo = new Date(now.setDate(now.getDate() - 60));

        const recentStability = await WaterQualityData.aggregate([
            {
                $match: {
                    createdAt: { $gte: thirtyDaysAgo }
                }
            },
            {
                $group: {
                    _id: null,
                    avgWQI: { $avg: "$waterQualityIndex" },
                    stdDevWQI: { $stdDevPop: "$waterQualityIndex" }
                }
            }
        ]);

        const previousStability = await WaterQualityData.aggregate([
            {
                $match: {
                    createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo }
                }
            },
            {
                $group: {
                    _id: null,
                    avgWQI: { $avg: "$waterQualityIndex" },
                    stdDevWQI: { $stdDevPop: "$waterQualityIndex" }
                }
            }
        ]);

        const stabilityTrend = {
            recent: recentStability[0] || null,
            previous: previousStability[0] || null,
            improvement: recentStability[0] && previousStability[0] ?
                recentStability[0].stdDevWQI < previousStability[0].stdDevWQI : null
        };

        return res.status(200).json({
            status: "success",
            message: "Water stability score calculated",
            data: {
                current: stabilityScores[0] || { stabilityScore: { overall: 0 } },
                trend: stabilityTrend
            }
        });
    } catch (error) {
        next(error);
    }
};


/*
|--------------------------------------------------------------------------
| getDistrictStatistics
|--------------------------------------------------------------------------
| Computes water quality statistics for a specific district.
|
| Expected operations:
| - Filter records by district.
| - Compute averages and trends.
|
| Purpose:
| Allows comparison of water quality across districts.
*/
export const getDistrictStatistics = async (req, res, next) => {
    try {
        const { district } = req.params;

        if (!district) {
            return res.status(400).json({
                status: "failed",
                message: "District parameter is required"
            });
        }

        const districtStats = await WaterQualityData.aggregate([
            {
                $match: { "location.district": district }
            },
            {
                $group: {
                    _id: "$location.district",
                    totalReadings: { $sum: 1 },
                    avgPH: { $avg: "$pH" },
                    avgTDS: { $avg: "$tds" },
                    avgTurbidity: { $avg: "$turbidity" },
                    avgConductivity: { $avg: "$electricalConductivity" },
                    avgWQI: { $avg: "$waterQualityIndex" },

                    minWQI: { $min: "$waterQualityIndex" },
                    maxWQI: { $max: "$waterQualityIndex" },
                    stdDevWQI: { $stdDevPop: "$waterQualityIndex" },

                    latestReading: { $max: "$createdAt" }
                }
            }
        ]);

        // Get time-based trends for the district
        const monthlyTrend = await WaterQualityData.aggregate([
            {
                $match: { "location.district": district }
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" }
                    },
                    avgWQI: { $avg: "$waterQualityIndex" },
                    readings: { $sum: 1 }
                }
            },
            {
                $sort: { "_id.year": -1, "_id.month": -1 }
            },
            {
                $limit: 12
            }
        ]);

        // Get list of all districts for reference
        const allDistricts = await WaterQualityData.distinct("location.district");

        if (districtStats.length === 0) {
            return res.status(404).json({
                status: "failed",
                message: `No data found for district: ${district}`
            });
        }

        return res.status(200).json({
            status: "success",
            message: `Statistics for district: ${district}`,
            data: {
                district: districtStats[0],
                monthlyTrend,
                availableDistricts: allDistricts
            }
        });
    } catch (error) {
        next(error);
    }
};


/*
|--------------------------------------------------------------------------
| getTreatmentPlantStatistics
|--------------------------------------------------------------------------
| Computes statistics for a specific treatment plant.
|
| Expected operations:
| - Filter records by treatment plant ID.
| - Compute parameter averages and trends.
|
| Purpose:
| Helps evaluate the performance of individual treatment plants.
*/
export const getTreatmentPlantStatistics = async (req, res, next) => {
    try {
        const { plantId } = req.params;

        console.log(plantId)

        if (!plantId) {
            return res.status(400).json({
                status: "failed",
                message: "Treatment plant ID is required"
            });
        }

        const plantStats = await WaterQualityData.aggregate([
            {
                $match: { "location.treatmentPlantId": plantId }
            },
            {
                $group: {
                    _id: {
                        plantId: "$location.treatmentPlantId",
                        district: "$location.district"
                    },
                    totalReadings: { $sum: 1 },
                    avgPH: { $avg: "$pH" },
                    avgTDS: { $avg: "$tds" },
                    avgTurbidity: { $avg: "$turbidity" },
                    avgConductivity: { $avg: "$electricalConductivity" },
                    avgWQI: { $avg: "$waterQualityIndex" },

                    minWQI: { $min: "$waterQualityIndex" },
                    maxWQI: { $max: "$waterQualityIndex" },
                    stdDevWQI: { $stdDevPop: "$waterQualityIndex" },

                    firstReading: { $min: "$createdAt" },
                    lastReading: { $max: "$createdAt" }
                }
            }
        ]);

        // Get daily performance for the last 30 days
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        const dailyPerformance = await WaterQualityData.aggregate([
            {
                $match: {
                    "location.treatmentPlantId": plantId,
                    createdAt: { $gte: thirtyDaysAgo }
                }
            },
            {
                $group: {
                    _id: {
                        date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }
                    },
                    avgWQI: { $avg: "$waterQualityIndex" },
                    avgTurbidity: { $avg: "$turbidity" },
                    readings: { $sum: 1 }
                }
            },
            {
                $sort: { "_id.date": 1 }
            }
        ]);

        // Get WQI classification distribution
        const classificationDist = await WaterQualityData.aggregate([
            {
                $match: { "location.treatmentPlantId": plantId }
            },
            {
                $group: {
                    _id: {
                        $switch: {
                            branches: [
                                { case: { $lte: ["$waterQualityIndex", 50] }, then: "Excellent" },
                                { case: { $lte: ["$waterQualityIndex", 100] }, then: "Good" },
                                { case: { $lte: ["$waterQualityIndex", 200] }, then: "Poor" }
                            ],
                            default: "Unsafe"
                        }
                    },
                    count: { $sum: 1 },
                    percentage: { $avg: 1 }
                }
            }
        ]);

        // Calculate total percentage
        const total = classificationDist.reduce((acc, curr) => acc + curr.count, 0);
        classificationDist.forEach(item => {
            item.percentage = (item.count / total * 100).toFixed(2) + "%";
        });

        if (plantStats.length === 0) {
            return res.status(404).json({
                status: "failed",
                message: `No data found for treatment plant: ${plantId}`
            });
        }

        return res.status(200).json({
            status: "success",
            message: `Statistics for treatment plant: ${plantId}`,
            data: {
                plantInfo: plantStats[0],
                dailyPerformance,
                classification: classificationDist
            }
        });
    } catch (error) {
        next(error);
    }
};


export const getTrendLine = async (req, res, next) => {
  try {
    const {
      period = 'last_30_days',
      startDate,
      endDate
    } = req.query;

    const dateFilter = buildDateFilter(period, startDate, endDate);

    const trends = await WaterQualityData.aggregate([
      {
        $match: dateFilter
      },
      {
        // group by day (important for charts)
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt"
            }
          },
          pH: { $avg: "$pH" },
          tds: { $avg: "$tds" },
          turbidity: { $avg: "$turbidity" },
          conductivity: { $avg: "$conductivity" },
          wqi: { $avg: "$waterQualityIndex" }
        }
      },
      {
        $sort: { _id: 1 }
      },
      {
        $project: {
          _id: 0,
          date: "$_id",
          pH: { $round: ["$pH", 2] },
          tds: { $round: ["$tds", 0] },
          turbidity: { $round: ["$turbidity", 2] },
          conductivity: { $round: ["$conductivity", 0] },
          wqi: { $round: ["$wqi", 1] }
        }
      }
    ]);

    return res.status(200).json({
      status: "success",
      message: "Trend line data fetched successfully",
      data: trends
    });

  } catch (error) {
    next(error);
  }
};

export const getWQIClassification = async (req, res, next) => {
    try {
        const { period = 'last_30_days', startDate, endDate } = req.query;

        // Use your existing helper to build the date filter
        const dateFilter = buildDateFilter(period, startDate, endDate);

        const classification = await WaterQualityData.aggregate([
            {
                $match: dateFilter
            },
            {
                // Step 1: Assign a label to every single reading based on WQI score
                $project: {
                    category: {
                        $switch: {
                            branches: [
                                { case: { $gte: ["$waterQualityIndex", 80] }, then: "Excellent" },
                                { case: { $gte: ["$waterQualityIndex", 60] }, then: "Good" },
                                { case: { $gte: ["$waterQualityIndex", 40] }, then: "Poor" }
                            ],
                            default: "Unsafe"
                        }
                    }
                }
            },
            {
                // Step 2: Count how many readings are in each category
                $group: {
                    _id: "$category",
                    count: { $sum: 1 }
                }
            },
            {
                $project: {
                    _id: 0,
                    category: "$_id",
                    count: 1
                }
            }
        ]);

        // Step 3: Ensure all categories exist in the response (even if count is 0)
        // This prevents the Donut Chart from "flickering" or missing labels
        const defaultCategories = ["Excellent", "Good", "Poor", "Unsafe"];
        const distribution = defaultCategories.map(cat => {
            const found = classification.find(item => item.category === cat);
            return {
                category: cat,
                count: found ? found.count : 0
            };
        });

        return res.status(200).json({
            status: "success",
            message: "WQI Classification fetched successfully",
            data: { distribution }
        });

    } catch (error) {
        next(error);
    }
};
