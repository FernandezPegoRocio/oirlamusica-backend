// Calendar Module
const Calendar = {
    currentMonth: new Date().getMonth(),
    currentYear: new Date().getFullYear(),
    events: [],
    
    init: () => {
        // Setup event listeners
        document.getElementById('prevMonth').addEventListener('click', () => {
            Calendar.previousMonth();
        });
        
        document.getElementById('nextMonth').addEventListener('click', () => {
            Calendar.nextMonth();
        });
        
        // Load initial calendar
        Calendar.loadCalendar();
    },
    
    previousMonth: () => {
        Calendar.currentMonth--;
        if (Calendar.currentMonth < 0) {
            Calendar.currentMonth = 11;
            Calendar.currentYear--;
        }
        Calendar.loadCalendar();
    },
    
    nextMonth: () => {
        Calendar.currentMonth++;
        if (Calendar.currentMonth > 11) {
            Calendar.currentMonth = 0;
            Calendar.currentYear++;
        }
        Calendar.loadCalendar();
    },
    
    loadCalendar: async () => {
        try {
            // Update header
            document.getElementById('currentMonth').textContent = 
                `${CONFIG.MONTHS[Calendar.currentMonth]} ${Calendar.currentYear}`;
            
            // Load events for the month
            const events = await API.public.getCalendar(
                Calendar.currentYear,
                Calendar.currentMonth + 1
            );
            Calendar.events = events;
            
            // Render calendar
            Calendar.render();
            
        } catch (error) {
            console.error('Error loading calendar:', error);
            Utils.showToast('Error al cargar el calendario', 'error');
        }
    },
    
    render: () => {
        const grid = document.getElementById('calendarGrid');
        grid.innerHTML = '';
        
        // Add day headers
        CONFIG.DAYS.forEach(day => {
            const header = document.createElement('div');
            header.className = 'calendar-day-header';
            header.textContent = day;
            grid.appendChild(header);
        });
        
        // Get first day of month
        const firstDay = new Date(Calendar.currentYear, Calendar.currentMonth, 1);
        const lastDay = new Date(Calendar.currentYear, Calendar.currentMonth + 1, 0);
        const prevLastDay = new Date(Calendar.currentYear, Calendar.currentMonth, 0);
        
        const startDay = firstDay.getDay();
        const totalDays = lastDay.getDate();
        const prevDays = prevLastDay.getDate();
        
        // Previous month days
        for (let i = startDay - 1; i >= 0; i--) {
            const day = Calendar.createDayElement(prevDays - i, true);
            grid.appendChild(day);
        }
        
        // Current month days
        for (let i = 1; i <= totalDays; i++) {
            const day = Calendar.createDayElement(i, false);
            grid.appendChild(day);
        }
        
        // Next month days
        const remainingDays = 42 - (startDay + totalDays);
        for (let i = 1; i <= remainingDays; i++) {
            const day = Calendar.createDayElement(i, true);
            grid.appendChild(day);
        }
    },
    
    createDayElement: (dayNumber, isOtherMonth) => {
        const dayDiv = document.createElement('div');
        dayDiv.className = 'calendar-day';
        
        if (isOtherMonth) {
            dayDiv.classList.add('other-month');
        }
        
        // Check if today
        const today = new Date();
        if (!isOtherMonth && 
            dayNumber === today.getDate() &&
            Calendar.currentMonth === today.getMonth() &&
            Calendar.currentYear === today.getFullYear()) {
            dayDiv.classList.add('today');
        }
        
        // Day number
        const dayNumberDiv = document.createElement('div');
        dayNumberDiv.className = 'calendar-day-number';
        dayNumberDiv.textContent = dayNumber;
        dayDiv.appendChild(dayNumberDiv);
        
        // Add events for this day
        if (!isOtherMonth) {
            const dayEvents = Calendar.getEventsForDay(dayNumber);
            if (dayEvents.length > 0) {
                const eventsDiv = document.createElement('div');
                eventsDiv.className = 'calendar-events';
                
                // Show max 3 events
                dayEvents.slice(0, 3).forEach(event => {
                    const eventDiv = document.createElement('div');
                    eventDiv.className = `calendar-event type-${event.entry_type}`;
                    eventDiv.textContent = `${Utils.formatTime(event.time)} ${event.artist_name}`;
                    eventDiv.title = event.title;
                    eventDiv.addEventListener('click', () => {
                        Events.showEventModal(event.id);
                    });
                    eventsDiv.appendChild(eventDiv);
                });
                
                // Show more indicator
                if (dayEvents.length > 3) {
                    const moreDiv = document.createElement('div');
                    moreDiv.className = 'more-events';
                    moreDiv.textContent = `+${dayEvents.length - 3} más`;
                    moreDiv.addEventListener('click', () => {
                        Events.showDayEvents(dayNumber);
                    });
                    eventsDiv.appendChild(moreDiv);
                }
                
                dayDiv.appendChild(eventsDiv);
            }
        }
        
        return dayDiv;
    },
    
    getEventsForDay: (day) => {
        return Calendar.events.filter(event => {
            const eventDate = new Date(event.date + 'T00:00:00');
            return eventDate.getDate() === day;
        });
    }
};