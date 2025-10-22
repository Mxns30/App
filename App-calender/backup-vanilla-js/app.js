class Calendar {
    constructor() {
        this.currentDate = new Date();
        this.currentMonth = this.currentDate.getMonth();
        this.currentYear = this.currentDate.getFullYear();
        
        this.monthYearElement = document.getElementById('monthYear');
        this.calendarDaysElement = document.getElementById('calendar-days');
        this.prevMonthBtn = document.getElementById('prevMonth');
        this.nextMonthBtn = document.getElementById('nextMonth');

        this.events = this.loadEvents();
        this.selectedDate = null;

        this.modal = document.getElementById('event-modal');
        this.modalDateElement = document.getElementById('modal-date');
        this.closeBtn = this.modal.querySelector('.close-btn');

        // 일정1 요소
        this.event1List = document.getElementById('event1-list');
        this.addEvent1Form = document.getElementById('add-event1-form');
        this.event1Input = document.getElementById('event1-input');

        // 일정2 요소
        this.event2List = document.getElementById('event2-list');
        this.addEvent2Form = document.getElementById('add-event2-form');
        this.event2Input = document.getElementById('event2-input');

        this.monthNames = [
            '1월', '2월', '3월', '4월', '5월', '6월',
            '7월', '8월', '9월', '10월', '11월', '12월'
        ];
        
        this.init();
    }
    
    init() {
        this.prevMonthBtn.addEventListener('click', () => this.previousMonth());
        this.nextMonthBtn.addEventListener('click', () => this.nextMonth());
        this.closeBtn.addEventListener('click', () => this.closeModal());

        this.addEvent1Form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addEvent('event1');
        });
        this.addEvent2Form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addEvent('event2');
        });

        this.modal.addEventListener('click', (e) => {
            if (e.target.matches('.delete-event-btn')) {
                const eventType = e.target.dataset.type;
                const index = e.target.dataset.index;
                this.deleteEvent(eventType, index);
            } else if (e.target.matches('.event-list li:not(.is-editing) > span')) {
                this.enterEditMode(e.target);
            } else if (e.target.matches('.save-event-btn')) {
                const li = e.target.closest('li.is-editing');
                const input = li.querySelector('.edit-event-input');
                this.updateEvent(e.target.dataset.type, e.target.dataset.index, input.value);
            } else if (e.target.matches('.cancel-edit-btn')) {
                this.cancelEditMode(e.target.closest('li.is-editing'));
            }
        });

        window.addEventListener('click', (e) => {
            if (e.target == this.modal) {
                this.closeModal();
            }
        });
        this.renderCalendar();
    }
    
    previousMonth() {
        this.currentMonth--;
        if (this.currentMonth < 0) {
            this.currentMonth = 11;
            this.currentYear--;
        }
        this.renderCalendar();
    }
    
    nextMonth() {
        this.currentMonth++;
        if (this.currentMonth > 11) {
            this.currentMonth = 0;
            this.currentYear++;
        }
        this.renderCalendar();
    }
    
    renderCalendar() {
        this.updateHeader();
        this.renderDays();
    }

    updateHeader() {
        this.monthYearElement.textContent = `${this.currentYear}년 ${this.monthNames[this.currentMonth]}`;
    }
    
    renderDays() {
        const firstDay = new Date(this.currentYear, this.currentMonth, 1);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());
        
        this.calendarDaysElement.innerHTML = '';
        
        // 6주를 렌더링하여 구조를 일관되게 유지
        for (let w = 0; w < 6; w++) {
            let containsDayOfCurrentMonth = false;
            const weekDays = [];

            for (let d = 0; d < 7; d++) {
                const date = new Date(startDate);
                date.setDate(startDate.getDate() + (w * 7) + d);
                
                const dayElement = document.createElement('div');
                dayElement.className = 'day';
                dayElement.textContent = date.getDate();
                
                if (date.getMonth() === this.currentMonth) {
                    containsDayOfCurrentMonth = true;
                    dayElement.classList.add('current-month-day');
                    dayElement.addEventListener('click', () => {
                        this.openModal(date);
                    });
                } else {
                    dayElement.classList.add('other-month');
                }
                
                if (this.isToday(date)) {
                    dayElement.classList.add('today');
                }
                
                if (date.getDay() === 0) { // Sunday
                    dayElement.classList.add('sunday');
                } else if (date.getDay() === 6) { // Saturday
                    dayElement.classList.add('saturday');
                }
                
                const dayKey = this.getDateKey(date);
                const dayEvents = this.events[dayKey] || { event1: [], event2: [] };
                if (dayEvents.event1?.length > 0 || dayEvents.event2?.length > 0) {
                    const marker = document.createElement('div');
                    marker.className = 'event-marker';
                    dayElement.appendChild(marker);
                }
                
                weekDays.push(dayElement);
            }
            
            // 현재 월의 날짜를 포함하는 주만 렌더링
            if (containsDayOfCurrentMonth) {
                const weekElement = document.createElement('div');
                weekElement.className = 'week';
                weekDays.forEach(day => weekElement.appendChild(day));
                this.calendarDaysElement.appendChild(weekElement);
            }
        }
    }
    
    isToday(date) {
        const today = new Date();
        return date.getDate() === today.getDate() &&
               date.getMonth() === today.getMonth() &&
               date.getFullYear() === today.getFullYear();
    }

    getDateKey(date) {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }

    openModal(date) {
        this.selectedDate = date;
        const dayKey = this.getDateKey(date);
        const dayEvents = this.events[dayKey] || { event1: [], event2: [] };

        this.modal.style.display = 'block';
        this.modalDateElement.textContent = `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;

        this.renderEventList(this.event1List, dayEvents.event1, 'event1');
        this.renderEventList(this.event2List, dayEvents.event2, 'event2');
    }

    closeModal() {
        // 모달을 닫기 전에 진행 중인 편집을 취소합니다.
        const editingLi = this.modal.querySelector('li.is-editing');
        if (editingLi) {
            this.cancelEditMode(editingLi);
        }
        this.modal.style.display = 'none';
    }

    renderEventList(listElement, events, eventType) {
        listElement.innerHTML = '';
        if (!events || events.length === 0) {
            listElement.innerHTML = '<li class="no-events">내용이 없습니다.</li>';
            return;
        }

        events.forEach((eventText, index) => {
            const li = document.createElement('li');
            li.innerHTML = `<span>${eventText}</span><button class="delete-event-btn" data-type="${eventType}" data-index="${index}">&times;</button>`;
            listElement.appendChild(li);
        });
    }

    enterEditMode(spanElement) {
        const editingLi = this.modal.querySelector('li.is-editing');
        if (editingLi) {
            this.cancelEditMode(editingLi);
        }

        const li = spanElement.parentElement;
        const eventType = li.closest('.event-list').id.includes('1') ? 'event1' : 'event2';
        const index = li.querySelector('.delete-event-btn').dataset.index;
        const currentText = spanElement.textContent;

        li.classList.add('is-editing');
        li.innerHTML = `
            <input type="text" class="edit-event-input" value="${currentText}">
            <div class="edit-controls">
                <button class="save-event-btn" data-type="${eventType}" data-index="${index}">저장</button>
                <button class="cancel-edit-btn">&times;</button>
            </div>
        `;
        const input = li.querySelector('.edit-event-input');
        input.focus();
        input.select();
    }

    cancelEditMode(li) {
        if (!li) return;
        const eventType = li.closest('.event-list').id.includes('1') ? 'event1' : 'event2';
        this.renderEventList(this[`${eventType}List`], this.events[this.getDateKey(this.selectedDate)][eventType], eventType);
    }

    addEvent(eventType) {
        const input = this[`${eventType}Input`];
        const list = this[`${eventType}List`];
        const eventText = input.value.trim();

        if (eventText && this.selectedDate) {
            const dayKey = this.getDateKey(this.selectedDate);
            if (!this.events[dayKey]) {
                this.events[dayKey] = { event1: [], event2: [] };
            }
            this.events[dayKey][eventType].push(eventText);
            
            this.saveEvents();
            this.renderEventList(list, this.events[dayKey][eventType], eventType);
            this.renderCalendar();
            input.value = '';
        }
    }

    updateEvent(eventType, index, newText) {
        if (!newText.trim()) {
            this.deleteEvent(eventType, index);
            return;
        }
        const dayKey = this.getDateKey(this.selectedDate);
        if (this.events[dayKey]?.[eventType]?.[index] !== undefined) {
            this.events[dayKey][eventType][index] = newText.trim();
            this.saveEvents();
            this.renderEventList(this[`${eventType}List`], this.events[dayKey][eventType], eventType);
        }
    }

    deleteEvent(eventType, index) {
        const dayKey = this.getDateKey(this.selectedDate);
        const list = this[`${eventType}List`];

        if (this.events[dayKey]?.[eventType]?.[index] !== undefined) {
            this.events[dayKey][eventType].splice(index, 1);

            if (this.events[dayKey].event1.length === 0 && this.events[dayKey].event2.length === 0) {
                delete this.events[dayKey];
            }
            
            this.saveEvents();
            this.renderEventList(list, this.events[dayKey]?.[eventType] || [], eventType);
            this.renderCalendar();
        }
    }

    saveEvents() {
        localStorage.setItem('calendarEvents-v4', JSON.stringify(this.events));
    }

    loadEvents() {
        const events = localStorage.getItem('calendarEvents-v4');
        return events ? JSON.parse(events) : {};
    }
}

// PWA 설치 프롬프트
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
});

// 캘린더 및 추가 기능 초기화
document.addEventListener('DOMContentLoaded', () => {
    new Calendar();

    const fab = document.getElementById('fab');
    fab.addEventListener('click', () => {
        window.location.href = 'new_page.html';
    });
});

// Service Worker 등록
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then((registration) => {
                console.log('SW registered: ', registration);
            })
            .catch((registrationError) => {
                console.log('SW registration failed: ', registrationError);
            });
    });
} 