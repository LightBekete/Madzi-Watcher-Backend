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
