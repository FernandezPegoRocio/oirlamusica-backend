// API Service
const API = {
    // Base request method
    request: async (endpoint, options = {}) => {
        const token = Utils.getToken();
        
        const config = {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        };
        
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        
        try {
            const response = await fetch(`${CONFIG.API_URL}${endpoint}`, config);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Error en la solicitud');
            }
            
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },
    
    // Auth endpoints
    auth: {
        login: (email, password) => {
            return API.request('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password })
            });
        },
        
        register: (data) => {
            return API.request('/auth/register', {
                method: 'POST',
                body: JSON.stringify(data)
            });
        }
    },
    
    // Public endpoints
    public: {
        getCalendar: (year, month) => {
            return API.request(`/public/calendar/${year}/${month}`);
        },
        
        getUpcoming: () => {
            return API.request('/public/upcoming');
        },
        
        getEvent: (id) => {
            return API.request(`/public/event/${id}`);
        },
        
        getArtists: () => {
            return API.request('/public/artists');
        },
        
        getArtistEvents: (id) => {
            return API.request(`/public/artist/${id}/events`);
        }
    },
    
    // Artist endpoints
    artist: {
        getProfile: () => {
            return API.request('/artist/profile');
        },
        
        updateProfile: (data) => {
            return API.request('/artist/profile', {
                method: 'PUT',
                body: JSON.stringify(data)
            });
        },
        
        getEvents: () => {
            return API.request('/artist/events');
        },
        
        createEvent: (data) => {
            return API.request('/artist/events', {
                method: 'POST',
                body: JSON.stringify(data)
            });
        },
        
        updateEvent: (id, data) => {
            return API.request(`/artist/events/${id}`, {
                method: 'PUT',
                body: JSON.stringify(data)
            });
        },
        
        deleteEvent: (id) => {
            return API.request(`/artist/events/${id}`, {
                method: 'DELETE'
            });
        }
    },
    
    // Admin endpoints
    admin: {
        getArtists: () => {
            return API.request('/admin/artists');
        },
        
        validateArtist: (id, validated) => {
            return API.request(`/admin/artists/${id}/validate`, {
                method: 'PUT',
                body: JSON.stringify({ validated })
            });
        },
        
        deleteArtist: (id) => {
            return API.request(`/admin/artists/${id}`, {
                method: 'DELETE'
            });
        },
        
        getEvents: () => {
            return API.request('/admin/events');
        },
        
        deleteEvent: (id) => {
            return API.request(`/admin/events/${id}`, {
                method: 'DELETE'
            });
        },
        
        getAudit: (limit = 100, offset = 0) => {
            return API.request(`/admin/audit?limit=${limit}&offset=${offset}`);
        }
    }
};