// Dashboard Module
const Dashboard = {
  currentEditEventId: null, // Para rastrear qué evento estamos editando

  init: () => {
    const user = Utils.getUser();
    if (!user) {
      App.navigateTo('calendar');
      return;
    }
    // Show appropriate dashboard
    if (user.role === 'admin') {
      Dashboard.initAdmin();
    } else {
      Dashboard.initArtist();
    }
    // Setup tab navigation
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tabName = e.target.dataset.tab;
        
        // Si hacen clic en "Nuevo Evento", reseteamos el formulario
        if (tabName === 'new-event') {
          Dashboard.resetEventForm();
        }

        Dashboard.switchTab(tabName);
      });
    });
  },

  initArtist: () => {
    document.getElementById('artistDashboard').style.display = 'block';
    document.getElementById('adminDashboard').style.display = 'none';
    
    Dashboard.loadArtistProfile();
    Dashboard.loadArtistEvents();
    
    document.getElementById('eventForm').addEventListener('submit', (e) => {
      e.preventDefault();
      Dashboard.handleEventSubmit(e.target); 
    });
    
    document.getElementById('profileForm').addEventListener('submit', (e) => {
      e.preventDefault();
      Dashboard.updateProfile(e.target);
    });
  },

  initAdmin: () => {
    document.getElementById('artistDashboard').style.display = 'none';
    document.getElementById('adminDashboard').style.display = 'block';
    Dashboard.loadAdminArtists();
    Dashboard.loadAdminEvents(); 
    Dashboard.loadAuditLog(); 
  },

  switchTab: (tabName) => {
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
    });
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`).classList.add('active');
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
  },

  handleEventSubmit: async (form) => {
    const formData = new FormData(form);
    const data = {};
    formData.forEach((value, key) => {
      data[key] = value || null;
    });

    try {
      if (Dashboard.currentEditEventId) {
        await API.artist.updateEvent(Dashboard.currentEditEventId, data);
        Utils.showToast('Evento actualizado exitosamente', 'success');
      } else {
        await API.artist.createEvent(data);
        Utils.showToast('Evento creado exitosamente', 'success');
      }
      
      Dashboard.resetEventForm(); 
      Dashboard.loadArtistEvents(); 
      Calendar.loadCalendar(); 
      Dashboard.switchTab('events'); 

    } catch (error) {
      const action = Dashboard.currentEditEventId ? 'actualizar' : 'crear';
      Utils.showToast(error.message || `Error al ${action} evento`, 'error');
    }
  },

  createEvent: (form) => {
     Dashboard.currentEditEventId = null;
     Dashboard.handleEventSubmit(form);
  },

  editEvent: async (eventId) => {
    try {
      const event = await API.public.getEvent(eventId);
      const form = document.getElementById('eventForm');

      form.querySelector('[name="title"]').value = event.title;
      form.querySelector('[name="date"]').value = new Date(event.date).toISOString().split('T')[0];
      form.querySelector('[name="time"]').value = event.time;
      form.querySelector('[name="venue"]').value = event.venue;
      form.querySelector('[name="entry_type"]').value = event.entry_type;
      form.querySelector('[name="price"]').value = event.price || '';
      form.querySelector('[name="ticket_url"]').value = event.ticket_url || '';
      form.querySelector('[name="flyer_url"]').value = event.flyer_url || '';
      form.querySelector('[name="description"]').value = event.description || '';
      
      Dashboard.currentEditEventId = event.id;
      
      form.querySelector('h3').textContent = 'Editar Evento';
      form.querySelector('button[type="submit"]').textContent = 'Guardar Cambios';
      
      Dashboard.switchTab('new-event');

    } catch (error) {
      Utils.showToast('Error al cargar datos del evento', 'error');
    }
  },
  
  resetEventForm: () => {
    const form = document.getElementById('eventForm');
    form.reset(); 
    form.querySelector('h3').textContent = 'Crear Nuevo Evento';
    form.querySelector('button[type="submit"]').textContent = 'Crear Evento';
    Dashboard.currentEditEventId = null; 
  },

  deleteEvent: async (eventId) => {
    if (!confirm('¿Estás seguro de eliminar este evento?')) {
      return;
    }
    try {
      await API.artist.deleteEvent(eventId);
      Utils.showToast('Evento eliminado exitosamente', 'success');
      Dashboard.loadArtistEvents();
      Calendar.loadCalendar();
    } catch (error) {
      Utils.showToast('Error al eliminar evento', 'error');
    }
  },

  loadArtistProfile: async () => {
    try {
      const profile = await API.artist.getProfile();
      const form = document.getElementById('profileForm');
      Object.keys(profile).forEach(key => {
        const input = form.querySelector(`[name="${key}"]`);
        if (input) {
          input.value = profile[key] || "";
        }
      });
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  },

  updateProfile: async (form) => {
    try {
      const formData = new FormData(form);
      const data = {};
      formData.forEach((value, key) => {
        data[key] = value || null;
      });
      await API.artist.updateProfile(data);
      Utils.showToast('Perfil actualizado exitosamente', 'success');
      
      const user = Utils.getUser();
      if (user.name !== data.name) {
          user.name = data.name;
          Utils.setAuth(Utils.getToken(), user);
          Auth.updateUI();
      }
      
    } catch (error) {
      Utils.showToast(error.message || 'Error al actualizar perfil', 'error');
    }
  },

  loadArtistEvents: async () => {
    try {
      const events = await API.artist.getEvents();
      Dashboard.renderArtistEvents(events);
    } catch (error) {
      console.error('Error loading events:', error);
    }
  },

  renderArtistEvents: (events) => {
    const container = document.getElementById('myEventsList');
    if (events.length === 0) {
      container.innerHTML = '<p>No tienes eventos creados</p>';
      return;
    }
    container.innerHTML = events.map(event =>
      `<div class="event-manager-item">
        <div class="event-manager-info">
          <h4>${Utils.escapeHtml(event.title)}</h4>
          <div class="event-info">
            <span>${Utils.formatDate(event.date)}</span>
            <span>${Utils.formatTime(event.time)}</span>
            <span>${Utils.escapeHtml(event.venue)}</span>
          </div>
        </div>
        <div class="event-manager-actions">
          <button class="btn btn-small btn-outline"
            onclick="Dashboard.editEvent(${event.id})">
            Editar
          </button>
          <button class="btn btn-small btn-danger"
            onclick="Dashboard.deleteEvent(${event.id})">
            Eliminar
          </button>
        </div>
      </div>`
    ).join('');
  },

  // --- Lógica de Administrador ---
  
  loadAdminArtists: async () => {
    try {
      const artists = await API.admin.getArtists();
      Dashboard.renderAdminArtists(artists);
    } catch (error) {
      console.error('Error loading artists:', error);
    }
  },

  // ESTA ES LA FUNCIÓN QUE ARREGLA EL BOTÓN "VALIDAR"
  renderAdminArtists: (artists) => {
    const container = document.getElementById('adminArtistsList');
    container.innerHTML = `
      <table class="admin-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Email</th>
            <th>Validado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${artists.map(artist => `
            <tr>
              <td>${Utils.escapeHtml(artist.name)}</td>
              <td>${Utils.escapeHtml(artist.email)}</td>
              <td>
                ${artist.validated ?
                  '<span class="event-type" style="background: #28a745;">Validado</span>' :
                  '<span class="event-type" style="background: #ffc107; color: #333;">Pendiente</span>'}
              </td>
              <td>
                <button class="btn btn-small btn-${artist.validated ? 'outline' : 'success'}"
                  onclick="Dashboard.validateArtist(${artist.id}, ${!artist.validated})">
                  ${artist.validated ? 'Invalidar' : 'Validar'}
                </button>
                <button class="btn btn-small btn-danger"
                  onclick="Dashboard.deleteArtist(${artist.id})">
                  Eliminar
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  },

  validateArtist: async (artistId, validated) => {
    try {
      await API.admin.validateArtist(artistId, validated);
      Utils.showToast(
        validated ? 'Artista validado' : 'Validación removida',
        'success'
      );
      Dashboard.loadAdminArtists();
    } catch (error) {
      Utils.showToast(error.message || 'Error al validar artista', 'error');
    }
  },

  deleteArtist: async (artistId) => {
    if (!confirm('¿Estás seguro de eliminar este artista? Esto eliminará su cuenta, perfil y todos sus eventos.')) {
      return;
    }
    try {
      await API.admin.deleteArtist(artistId);
      Utils.showToast('Artista eliminado', 'success');
      Dashboard.loadAdminArtists();
    } catch (error) {
      Utils.showToast('Error al eliminar artista', 'error');
    }
  },

  loadAdminEvents: async () => {
     try {
        const events = await API.admin.getEvents();
        Dashboard.renderAdminEvents(events);
     } catch (error) {
        console.error('Error loading events:', error);
     }
  },
  
  renderAdminEvents: (events) => {
    const container = document.getElementById('adminEventsList');
    container.innerHTML = `
      <table class="admin-table">
        <thead>
          <tr>
            <th>Evento</th>
            <th>Artista</th>
            <th>Fecha</th>
            <th>Lugar</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${events.map(event => `
            <tr>
              <td>${Utils.escapeHtml(event.title)}</td>
              <td>${Utils.escapeHtml(event.artist_name)}</td>
              <td>${Utils.formatDate(event.date)} ${Utils.formatTime(event.time)}</td>
              <td>${Utils.escapeHtml(event.venue)}</td>
              <td>
                <button class="btn btn-small btn-danger"
                  onclick="Dashboard.deleteAdminEvent(${event.id})">
                  Eliminar
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  },
  
  deleteAdminEvent: async (eventId) => {
    if (!confirm('¿Estás seguro de eliminar este evento?')) {
      return;
    }
    try {
      await API.admin.deleteEvent(eventId);
      Utils.showToast('Evento eliminado por admin', 'success');
      Dashboard.loadAdminEvents();
      Calendar.loadCalendar(); 
    } catch (error) {
      Utils.showToast('Error al eliminar evento', 'error');
    }
  },
  
  loadAuditLog: async () => {
     try {
        const logs = await API.admin.getAudit();
        Dashboard.renderAuditLog(logs);
     } catch (error) {
        console.error('Error loading audit log:', error);
     }
  },

  renderAuditLog: (logs) => {
    const container = document.getElementById('auditLog');
    container.innerHTML = logs.map(log => `
      <div class="audit-entry">
        <div class="audit-entry-header">
          <span class="audit-action">${Utils.escapeHtml(log.action)}</span>
          <span class="audit-timestamp">${new Date(log.created_at).toLocaleString()}</span>
        </div>
        <div class="audit-details">
          Usuario: ${Utils.escapeHtml(log.email || 'Desconocido')} |
          Entidad: ${Utils.escapeHtml(log.entity)} |
          ID: ${log.entity_id || 'N/A'}
          ${log.ip_address ? ` | IP: ${Utils.escapeHtml(log.ip_address)}` : ''}
        </div>
      </div>
    `).join('');
  }
};