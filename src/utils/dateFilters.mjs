import { startOfDay, endOfDay, startOfWeek, endOfMonth, startOfYear, subDays, subWeeks, subMonths, subYears } from 'date-fns'; 
// Optional: install date-fns for cleaner date math (recommended)

export const buildDateFilter = (period, startDate, endDate) => {
    const now = new Date();
    let filter = {};

    switch (period?.toLowerCase()) {
        case 'all':
        case undefined:
            return {}; // no date filter

        case 'today':
            filter = {
                createdAt: {
                    $gte: startOfDay(now),
                    $lte: endOfDay(now)
                }
            };
            break;

        case 'this_week':
        case 'week':
            const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
            filter = {
                createdAt: {
                    $gte: weekStart,
                    $lte: endOfDay(now)
                }
            };
            break;

        case 'last_7_days':
            filter = {
                createdAt: { $gte: subDays(now, 7) }
            };
            break;

        case 'this_month':
        case 'month':
            filter = {
                createdAt: {
                    $gte: new Date(now.getFullYear(), now.getMonth(), 1),
                    $lte: endOfDay(now)
                }
            };
            break;

        case 'last_30_days':
            filter = { createdAt: { $gte: subDays(now, 30) } };
            break;

        case 'last_90_days':
            filter = { createdAt: { $gte: subDays(now, 90) } };
            break;

        case 'this_year':
        case 'year':
            filter = {
                createdAt: {
                    $gte: startOfYear(now),
                    $lte: endOfDay(now)
                }
            };
            break;

        case 'last_12_months':
            filter = { createdAt: { $gte: subMonths(now, 12) } };
            break;

        case 'range':
            if (startDate || endDate) {
                filter.createdAt = {};
                if (startDate) filter.createdAt.$gte = new Date(startDate);
                if (endDate) filter.createdAt.$lte = new Date(endDate);
            }
            break;

        default:
            // fallback to all
            return {};
    }

    return filter;
};