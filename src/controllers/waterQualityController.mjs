import WaterQualityData from "../models/WaterQualityData.mjs";


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
        const meanStats = await WaterQualityData.aggregate([
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

        if (meanStats.length === 0) {
            return res.status(404).json({
                status: "failed",
                message: "No data available for mean statistics"
            });
        }

        return res.status(200).json({
            status: "success",
            message: "Mean statistics calculated successfully",
            data: meanStats[0]
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
        const varianceStats = await WaterQualityData.aggregate([
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
        const stdDevStats = await WaterQualityData.aggregate([
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
        const getAllValues = async (field) => {
            const values = await WaterQualityData.find({}, { [field]: 1, _id: 0 })
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
        const minMaxStats = await WaterQualityData.aggregate([
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