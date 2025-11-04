// Main App
const App = {
    init: () => {
        // Initialize modules
        Auth.init();
        Calendar.init();
        Events.init();
        
        // Setup navigation
        App.setupNavigation();
        
        // Setup modal close buttons
        App.setupModals();
        
        // Load artists
        App.loadArtists();
        
        // Setup dashboard button
        document.getElementById('dashboardBtn').addEventListener('click', () => {
            App.navigateTo('dashboard');
            Dashboard.init();
        });
    },
    
    setupNavigation: () => {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const target = link.getAttribute('href').substring(1);
                App.navigateTo(target);
            });
        });
    },
    
    navigateTo: (section) => {
        // Hide all sections
        document.querySelectorAll('.section').forEach(sec => {
            sec.classList.remove('active');
            sec.style.display = 'none';
        });
        
        // Show selected section
        const targetSection = document.getElementById(section);
        if (targetSection) {
            targetSection.style.display = 'block';
            targetSection.classList.add('active');
        }
        
        // Update nav
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${section}`) {
                link.classList.add('active');
            }
        });
    },
    
    setupModals: () => {
        // Close button functionality
        document.querySelectorAll('.modal .close').forEach(closeBtn => {
            closeBtn.addEventListener('click', () => {
                closeBtn.closest('.modal').classList.remove('show');
            });
        });
        
        // Click outside to close
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('show');
                }
            });
        });
        
        // ESC key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                document.querySelectorAll('.modal.show').forEach(modal => {
                    modal.classList.remove('show');
                });
            }
        });
    },
    
    loadArtists: async () => {
        try {
            const artists = await API.public.getArtists();
            App.renderArtists(artists);
        } catch (error) {
            console.error('Error loading artists:', error);
        }
    },
    
    renderArtists: (artists) => {
        const container = document.getElementById('artistsGrid');
        
        if (artists.length === 0) {
            container.innerHTML = `
                <div class="calendar-empty">
                    <h3>No hay artistas registrados</h3>
                    <p>Aún no hay artistas validados en la plataforma</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = artists.map(artist => `
            <div class="card artist-card" onclick="App.showArtistModal(${artist.id})">
                ${artist.photo_url ? `
                    <img src="${Utils.escapeHtml(artist.photo_url)}" 
                         alt="${Utils.escapeHtml(artist.name)}" 
                         class="artist-avatar"
                         onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><circle cx=%2250%22 cy=%2250%22 r=%2250%22 fill=%22%231e3a5f%22/><text x=%2250%%22 y=%2250%%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22white%22 font-size=%2240%22>${artist.name.charAt(0).toUpperCase()}</text></svg>'">
                ` : `
                    <div class="artist-avatar" style="background: var(--primary-color); display: flex; align-items: center; justify-content: center; color: white; font-size: 2rem;">
                        ${artist.name.charAt(0).toUpperCase()}
                    </div>
                `}
                <div class="artist-name">${Utils.escapeHtml(artist.name)}</div>
                <div class="artist-socials">
                    ${artist.instagram ? `
                        <a href="https://instagram.com/${Utils.escapeHtml(artist.instagram.replace('@', ''))}" 
                           class="social-link" 
                           target="_blank" 
                           onclick="event.stopPropagation()">📷</a>
                    ` : ''}
                    ${artist.spotify ? `
                        <a href="${Utils.escapeHtml(artist.spotify)}" 
                           class="social-link" 
                           target="_blank"
                           onclick="event.stopPropagation()">🎵</a>
                    ` : ''}
                    ${artist.youtube_channel ? `
                        <a href="${Utils.escapeHtml(artist.youtube_channel)}" 
                           class="social-link" 
                           target="_blank"
                           onclick="event.stopPropagation()">📺</a>
                    ` : ''}
                </div>
            </div>
        `).join('');
    },
    
    showArtistModal: async (artistId) => {
        try {
            const events = await API.public.getArtistEvents(artistId);
            const artists = await API.public.getArtists();
            const artist = artists.find(a => a.id === artistId);
            
            if (!artist) return;
            
            const modal = document.getElementById('eventModal');
            const modalBody = document.getElementById('modalBody');
            
            modalBody.innerHTML = `
                <div class="artist-modal-header">
                    ${artist.photo_url ? `
                        <img src="${Utils.escapeHtml(artist.photo_url)}" 
                             alt="${Utils.escapeHtml(artist.name)}" 
                             class="artist-modal-avatar">
                    ` : `
                        <div class="artist-modal-avatar" style="background: white; color: var(--primary-color); display: flex; align-items: center; justify-content: center; font-size: 3rem;">
                            ${artist.name.charAt(0).toUpperCase()}
                        </div>
                    `}
                    <h2 class="artist-modal-name">${Utils.escapeHtml(artist.name)}</h2>
                    <div class="artist-modal-socials">
                        ${artist.instagram ? `
                            <a href="https://instagram.com/${Utils.escapeHtml(artist.instagram.replace('@', ''))}" 
                               target="_blank">📷</a>
                        ` : ''}
                        ${artist.spotify ? `
                            <a href="${Utils.escapeHtml(artist.spotify)}" 
                               target="_blank">🎵</a>
                        ` : ''}
                        ${artist.youtube_channel ? `
                            <a href="${Utils.escapeHtml(artist.youtube_channel)}" 
                               target="_blank">📺</a>
                        ` : ''}
                    </div>
                </div>
                
                <div class="artist-modal-section">
                    <h3>Próximos Eventos</h3>
                    ${events.length > 0 ? `
                        <div class="events-list">
                            ${events.map(event => `
                                <div class="event-item" onclick="Events.showEventModal(${event.id})">
                                    <div class="event-date">
                                        <div class="event-day">${new Date(event.date + 'T00:00:00').getDate()}</div>
                                        <div class="event-month">${CONFIG.MONTHS[new Date(event.date + 'T00:00:00').getMonth()].slice(0, 3)}</div>
                                    </div>
                                    <div class="event-details">
                                        <div class="event-title">${Utils.escapeHtml(event.title)}</div>
                                        <div class="event-info">
                                            <span>📍 ${Utils.escapeHtml(event.venue)}</span>
                                            <span>🕐 ${Utils.formatTime(event.time)}</span>
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    ` : `
                        <p>No hay eventos programados</p>
                    `}
                </div>
            `;
            
            modal.classList.add('show');
            
        } catch (error) {
            console.error('Error showing artist modal:', error);
            Utils.showToast('Error al cargar información del artista', 'error');
        }
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});