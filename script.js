document.addEventListener("DOMContentLoaded", function() {
    const header = document.querySelector(".calendar h3");
    const dates = document.querySelector(".calendar .dates");
    const navs = document.querySelectorAll("#previous, #next");
    const eventForm = document.getElementById("event-form");
    const eventTitleInput = document.getElementById("event-title");
    const eventStartInput = document.getElementById("event-start");
    const eventEndInput = document.getElementById("event-end");
    const notificationEnableInput = document.getElementById("notification-enable");
    const notificationTimeInput = document.getElementById("notification-time");
    const saveEventButton = document.getElementById("save-event");
    const closeButton = document.querySelector("#event-form button:last-child");
    const eventDetails = document.getElementById("event-details");
    const notificationPopup = document.getElementById("notification-popup");
    const notificationContent = document.getElementById("notification-content");
    const closeNotificationButton = document.getElementById("close-notification");
    const viewModeSelector = document.getElementById("view-mode");
    const dayGrid = document.querySelector(".day-grid");

    const months = [
        "January", "February", "March", "April", "May", 
        "June", "July", "August", "September", "October", "November", "December"
    ];

    let date = new Date();
    let month = date.getMonth();
    let year = date.getFullYear();
    let selectedDate = null;
    const events = {};

    function renderCalendar() {
        const start = new Date(year, month, 1).getDay();
        const endDate = new Date(year, month + 1, 0).getDate();
        const end = new Date(year, month, endDate).getDay();
        const endDatePrev = new Date(year, month, 0).getDate();
    
        let datesHtml = "";
    
        for (let i = start; i > 0; i--) {
            datesHtml += `<li class="inactive">${endDatePrev - i + 1}</li>`;
        }
    
        for (let i = 1; i <= endDate; i++) {
            let className =
                i === date.getDate() &&
                month === new Date().getMonth() &&
                year === new Date().getFullYear()
                ? ' class="today"'
                : "";
            datesHtml += `<li data-date="${i}" data-month="${month}" data-year="${year}"${className}>${i}</li>`;
        }
    
        for (let i = end; i < 6; i++) {
            datesHtml += `<li class="inactive">${i - end + 1}</li>`;
        }
    
        dates.innerHTML = datesHtml;
        header.textContent = `${months[month]} ${year}`;
    
        document.querySelectorAll('.dates li:not(.inactive)').forEach(dateCell => {
            dateCell.addEventListener('click', () => {
                selectedDate = dateCell;
                const dateKey = `${selectedDate.dataset.date}-${selectedDate.dataset.month}-${selectedDate.dataset.year}`;
                if (events[dateKey]) {
                    showEventDetails(selectedDate);
                } else {
                    createEventForm(dateCell);
                }
            });
        });
    
        Object.keys(events).forEach(dateKey => {
            const [day, eventMonth, eventYear] = dateKey.split('-').map(Number);
            if (eventMonth === month && eventYear === year) {
                const dateCell = document.querySelector(`.dates li[data-date='${day}']`);
                if (dateCell) {
                    dateCell.innerHTML += `<span class="event-marker"></span>`;
                }
            }
        });
    
        renderPreviousEvents();
        renderDayGrid(parseInt(viewModeSelector.value));
    }
    

    function createEventForm(dateCell) {
        eventForm.style.display = "block";
        eventTitleInput.value = "";
        eventStartInput.value = "";
        eventEndInput.value = "";
        notificationEnableInput.checked = false;
        notificationTimeInput.value = "";
        saveEventButton.onclick = saveEvent; // Изменено для использования формы
    }

    function saveEvent() {
        const eventTitle = eventTitleInput.value;
        const eventStart = new Date(eventStartInput.value);
        const eventEnd = new Date(eventEndInput.value);
        const notificationEnabled = notificationEnableInput.checked;
        const notificationTime = notificationTimeInput.value;

        if (!eventTitle || isNaN(eventStart) || isNaN(eventEnd)) return;

        const dateKey = `${eventStart.getDate()}-${eventStart.getMonth()}-${eventStart.getFullYear()}`;
        if (!events[dateKey]) events[dateKey] = [];

        const newEvent = {
            title: eventTitle,
            start: eventStart.toISOString(),
            end: eventEnd.toISOString(),
            notification: notificationEnabled ? {
                enabled: true,
                time: parseInt(notificationTime, 10) || 0
            } : null
        };

        events[dateKey].push(newEvent);

        renderCalendar();
        closeForm();
        scheduleNotification(newEvent);
    }

    function closeForm() {
        eventForm.style.display = "none";
        selectedDate = null;
    }

    function showEventDetails(dateCell) {
        selectedDate = dateCell; // Добавляем это, чтобы сохранить текущую выбранную дату
        const dateKey = `${dateCell.dataset.date}-${dateCell.dataset.month}-${dateCell.dataset.year}`;
        const eventList = document.getElementById("event-list");
        eventList.innerHTML = "";

        if (events[dateKey] && events[dateKey].length > 0) {
            events[dateKey].forEach((event, index) => {
                const eventItem = document.createElement("div");
                eventItem.classList.add("event-item");

                const eventContent = document.createElement("span");
                const startDate = new Date(event.start);
                const endDate = new Date(event.end);
                eventContent.textContent = `${event.title} (${formatDate(startDate)} - ${formatDate(endDate)})`;

                const editButton = document.createElement("button");
                editButton.textContent = "Edit";
                editButton.addEventListener("click", () => editEvent(dateKey, index));

                const deleteButton = document.createElement("button");
                deleteButton.textContent = "Delete";
                deleteButton.addEventListener("click", () => deleteEvent(dateKey, index));

                eventItem.appendChild(eventContent);
                eventItem.appendChild(editButton);
                eventItem.appendChild(deleteButton);
                eventList.appendChild(eventItem);
            });
        }

        eventDetails.style.display = "block";
    }

    function editEvent(dateKey, eventIndex) {
        const event = events[dateKey][eventIndex];
        eventTitleInput.value = event.title;
        eventStartInput.value = new Date(event.start).toISOString().slice(0, 16);
        eventEndInput.value = new Date(event.end).toISOString().slice(0, 16);
        notificationEnableInput.checked = event.notification?.enabled || false;
        notificationTimeInput.value = event.notification?.time || "";

        eventForm.style.display = "block";

        saveEventButton.onclick = () => saveEditedEvent(dateKey, eventIndex);
    }

    function deleteEvent(dateKey, eventIndex) {
        events[dateKey].splice(eventIndex, 1);
        if (events[dateKey].length === 0) {
            delete events[dateKey];
        }
        renderCalendar();
        if (selectedDate && `${selectedDate.dataset.date}-${selectedDate.dataset.month}-${selectedDate.dataset.year}` === dateKey) {
            showEventDetails(selectedDate);
        } else {
            eventDetails.style.display = "none";
        }
    }

    function saveEditedEvent(originalDateKey, eventIndex) {
        const eventTitle = eventTitleInput.value;
        const eventStart = new Date(eventStartInput.value);
        const eventEnd = new Date(eventEndInput.value);
        const notificationEnabled = notificationEnableInput.checked;
        const notificationTime = notificationTimeInput.value;

        if (!eventTitle || isNaN(eventStart) || isNaN(eventEnd)) return;

        const updatedEvent = {
            title: eventTitle,
            start: eventStart.toISOString(),
            end: eventEnd.toISOString(),
            notification: notificationEnabled ? {
                enabled: true,
                time: parseInt(notificationTime, 10) || 0
            } : null
        };

        const newDateKey = `${eventStart.getDate()}-${eventStart.getMonth()}-${eventStart.getFullYear()}`;

        // Если дата изменилась, нужно удалить событие из старого ключа и добавить в новый
        if (originalDateKey !== newDateKey) {
            events[originalDateKey].splice(eventIndex, 1);
            if (events[originalDateKey].length === 0) {
                delete events[originalDateKey];
            }

            if (!events[newDateKey]) {
                events[newDateKey] = [];
            }
            events[newDateKey].push(updatedEvent);
        } else {
            // Если дата не изменилась, просто обновляем событие
            events[originalDateKey][eventIndex] = updatedEvent;
        }

        renderCalendar();
        showEventDetails(selectedDate);
        scheduleNotification(updatedEvent);
    }

    function scheduleNotification(event) {
    if (!event.notification || !event.notification.enabled) return;

    const notificationTime = event.notification.time * 60000;
    const eventStart = new Date(event.start).getTime();
    const now = Date.now();

    const timeout = eventStart - now - notificationTime;

    if (timeout > 0) {
        setTimeout(() => {
            showNotification(event);
        }, timeout);
    }
    }

    function showNotification(event) {
        const formattedStartDate = formatDate(new Date(event.start));
        notificationContent.textContent = `Reminder: ${event.title} starting at ${formattedStartDate}`;
        notificationPopup.style.display = 'block';
    }

    

    function renderPreviousEvents() {
        const eventsList = document.getElementById("events-list");
        eventsList.innerHTML = "";

        let allEvents = [];

        Object.keys(events).forEach(date => {
            allEvents = allEvents.concat(events[date]);
        });

        const now = new Date();

        const previousEvents = allEvents.filter(event => {
            const eventEnd = new Date(event.end);
            return eventEnd < now;
        });

        previousEvents.sort((a, b) => new Date(b.start) - new Date(a.start));

        const maxEventsToShow = 10;
        const eventsToShow = previousEvents.slice(0, maxEventsToShow);

        eventsToShow.forEach(event => {
            const eventDiv = document.createElement("div");
            eventDiv.textContent = `Event: ${event.title}, Start: ${formatDate(new Date(event.start))}, End: ${formatDate(new Date(event.end))}`;
            eventsList.appendChild(eventDiv);
        });
    }

    function renderDayGrid(days) {
        const today = new Date();
        dayGrid.innerHTML = "";

        for (let i = 0; i < days; i++) {
            const day = new Date(today.getTime());
            day.setDate(today.getDate() + i);

            const dayCell = document.createElement("div");
            dayCell.className = "day-cell";
            dayCell.innerHTML = `<span>${day.toLocaleDateString()}</span>`;

            const dateKey = `${day.getDate()}-${day.getMonth()}-${day.getFullYear()}`;

            if (events[dateKey]) {
                events[dateKey].forEach(event => {
                    const eventDiv = document.createElement("div");
                    eventDiv.className = "event";
                    eventDiv.textContent = event.title;
                    dayCell.appendChild(eventDiv);
                });
            }

            dayGrid.appendChild(dayCell);
        }
    }

    function formatDate(date) {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');

        return `${day}.${month}.${year} ${hours}:${minutes}:${seconds}`;
    }

    navs.forEach(nav => {
        nav.addEventListener("click", () => {
            month = nav.id === "next" ? month + 1 : month - 1;

            if (month < 0 || month > 11) {
                date = new Date(year, month);
                year = date.getFullYear();
                month = date.getMonth();
            } else {
                date = new Date();
            }
            renderCalendar();
        });
    });

    closeButton.addEventListener("click", closeForm);

    closeNotificationButton.addEventListener("click", () => {
        notificationPopup.style.display = 'none';
    });

    viewModeSelector.addEventListener("change", () => {
        renderDayGrid(parseInt(viewModeSelector.value));
    });

    renderCalendar();
});