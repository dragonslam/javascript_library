/** common.base.schedule.js */
(function($w, root) {
    'use strict';

    if (!!!$w) return;
    if (!!!$w[root]) return;

    const Base    = $w[root];
    const Schedule= Base.Schedule;
    
    Schedule.ScheduleCount   = 0;
    Schedule.ScheduleHeapSize= 100;
    Schedule.getScheduleUUID = function() {
        return 'S_'+(++Schedule.ScheduleCount).toString(32);
    };

}) (window, __DOMAIN_NAME||'');