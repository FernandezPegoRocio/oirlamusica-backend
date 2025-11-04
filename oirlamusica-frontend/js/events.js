// Events Module
const Events = {
  init: () => {
    Events.loadUpcoming();
  },

  loadUpcoming: async () => {
    try {
      // Pedimos los eventos
      const events = await API.public.getUpcoming();
      // Se los pasamos a la función que renderiza
      Events.renderUpcoming(events);
    } catch (error) {
      console.error('Error loading upcoming events:', error);
      // Si la API falla, mostramos un error
      const container = document.getElementById('eventsList');
      container.innerHTML = `<div class="calendar-empty"><p>Error al cargar eventos.</p></div>`;
    }
  },

  renderUpcoming: (events) => {
    const container = document.getElementById('eventsList');
    container.innerHTML = "";
    
    // Si no hay eventos, o la API devolvió algo inesperado
    if (!events || events.length === 0) {
      container.innerHTML =
        `<div class="calendar-empty">
          <h3>No hay eventos próximos</h3>
          <p>No se encontraron eventos programados</p>
         </div>`;
      return;
    }

    events.forEach(event => {
      const eventDiv = document.createElement('div');
      eventDiv.className = 'event-item';
      eventDiv.onclick = () => Events.showEventModal(event.id);

      // --- ESTA ES LA CORRECCIÓN ---
      // Verificamos si la fecha es válida ANTES de usarla
      const eventDate = new Date(event.date + 'T00:00:00');
      let day = 'Día';
      let month = 'Inv.'; // Abreviatura de Inválido

      // Solo si la fecha es válida, intentamos formatearla
      if (event.date && !isNaN(eventDate.getDate())) {
        day = eventDate.getDate();
        month = CONFIG.MONTHS[eventDate.getMonth()].slice(0, 3);
      }
      // --- FIN DE LA CORRECCIÓN ---

      eventDiv.innerHTML = `
        <div class="event-date">
          <div class="event-day">${day}</div>
          <div class="event-month">${month}</div>
        </div>
        <div class="event-details">
          <div class="event-title">${Utils.escapeHtml(event.title)}</div>
          <div class="event-info">
            <span>${Utils.escapeHtml(event.artist_name)}</span>
            <span>${Utils.escapeHtml(event.venue)}</span>
            <span>${Utils.formatTime(event.time)}</span>
            <span class="event-type">${CONFIG.ENTRY_TYPES[event.entry_type]}</span>
            ${event.price ? `<span>${Utils.formatCurrency(event.price)}</span>` : ''}
          </div>
        </div>
      `;
      container.appendChild(eventDiv);
    });
  },

  showEventModal: async (eventId) => {
    const modal = document.getElementById('eventModal');
    const modalBody = document.getElementById('modalBody');
    
    // Limpiar modal y mostrar spinner
    modalBody.innerHTML = '<div class="modal-loading"><div class="spinner"></div></div>';
    modal.classList.add('show');

    try {
        const event = await API.public.getEvent(eventId);
        Events.renderEventModal(event);
    } catch (error) {
        console.error('Error loading event:', error);
        modalBody.innerHTML = '<div class="modal-error"><h3>Error al cargar</h3><p>No se pudo cargar la información del evento.</p></div>';
    }
  },

  renderEventModal: (event) => {
    const modal = document.getElementById('eventModal');
    const modalBody = document.getElementById('modalBody');
    
    // Usamos la función segura que ya arreglamos en config.js
    const formattedDate = Utils.formatDate(event.date);

    modalBody.innerHTML = `
    <div class="event-modal-header">
      ${event.flyer_url ?
        `<img src="${Utils.escapeHtml(event.flyer_url)}" alt="${Utils.escapeHtml(event.title)}" class="event-modal-image" onerror="this.style.display='none'">` :
        '<div class="event-modal-image" style="background: var(--background); display: flex; align-items: center; justify-content: center; color: var(--text-light);">Sin Flyer</div>'
      }
      <div class="event-modal-info">
        <h2 class="event-modal-title">${Utils.escapeHtml(event.title)}</h2>
        <div class="event-modal-artist">${Utils.escapeHtml(event.artist_name)}</div>
        <div class="event-modal-details">
          <div class="event-modal-detail">
            <span class="event-modal-detail-label">Fecha:</span>
            <span class="event-modal-detail-value">${formattedDate}</span>
          </div>
          <div class="event-modal-detail">
            <span class="event-modal-detail-label">Hora:</span>
            <span class="event-modal-detail-value">${Utils.formatTime(event.time)}</span>
          </div>
          <div class="event-modal-detail">
            <span class="event-modal-detail-label">Lugar:</span>
            <span class="event-modal-detail-value">${Utils.escapeHtml(event.venue)}</span>
          </div>
          <div class="event-modal-detail">
            <span class="event-modal-detail-label">Entrada:</span>
            <span class="event-modal-badge">${CONFIG.ENTRY_TYPES[event.entry_type]}</span>
          </div>
          ${event.price ? `
          <div class="event-modal-detail">
            <span class="event-modal-detail-label">Precio:</span>
            <span class="event-modal-detail-value">${Utils.formatCurrency(event.price)}</span>
          </div>` : ''}
        </div>
      </div>
    </div>
    ${event.description ? `
    <div class="event-modal-description">
      <h3>Descripción</h3>
      <p>${Utils.escapeHtml(event.description).replace(/\n/g, '<br>')}</p>
    </div>` : ''}
    <div class="event-modal-actions">
      ${event.ticket_url ? `
        <a href="${Utils.escapeHtml(event.ticket_url)}" target="_blank" class="btn btn-primary">
          Comprar Entradas
        </a>` : ''}
      ${event.instagram ? `
        <a href="https://instagram.com/${Utils.escapeHtml(event.instagram.replace('@', ''))}" target="_blank" class="btn btn-outline">
          Instagram
        </a>` : ''}
      ${event.spotify ? `
        <a href="${Utils.escapeHtml(event.spotify)}" target="_blank" class="btn btn-outline">
          Spotify
        </a>` : ''}
    </div>
    `;
  },

  showDayEvents: (day) => {
    const dayEvents = Calendar.getEventsForDay(day);
    const modal = document.getElementById('eventModal');
    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
      <h2>Eventos del ${day} de ${CONFIG.MONTHS[Calendar.currentMonth]}</h2>
      <div class="events-list">
        ${dayEvents.map(event => `
          <div class="event-item" onclick="Events.showEventModal(${event.id})">
            <div class="event-details">
              <div class="event-title">${Utils.escapeHtml(event.title)} (${Utils.formatTime(event.time)})</div>
              <div class="event-info">
                <span>${Utils.escapeHtml(event.artist_name)}</span>
                <span>${Utils.escapeHtml(event.venue)}</span>
                <span class="event-type">${CONFIG.ENTRY_TYPES[event.entry_type]}</span>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
    modal.classList.add('show');
  }
};