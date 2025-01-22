export const calculateBreastFeedingStats = (feedings: any[]) => {
    const stats = {
        totalDuration: 0,
        averageDuration: 0,
        leftBreastCount: 0,
        rightBreastCount: 0,
        maxDuration: 0,
        totalCount: feedings.length,
        dailyStats: {} as { [key: string]: number }
    };

    feedings.forEach(feeding => {
        stats.totalDuration += feeding.duration;
        stats.maxDuration = Math.max(stats.maxDuration, feeding.duration);

        if (feeding.breast === 'left') stats.leftBreastCount++;
        if (feeding.breast === 'right') stats.rightBreastCount++;

        const date = feeding.startTime.toISOString().split('T')[0];
        stats.dailyStats[date] = (stats.dailyStats[date] || 0) + feeding.duration;
    });

    stats.averageDuration = feedings.length ? stats.totalDuration / feedings.length : 0;

    return stats;
}; 