// Configuration
const CONFIG = {
  API_URL: 'http://localhost:3001/api',
  APP_NAME: 'Oir La Música',
  MONTHS: [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ],
  DAYS: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
  ENTRY_TYPES: {
    'gratuito': 'Gratuito',
    'gorra': 'A la gorra',
    'beneficio': 'A beneficio',
    'arancelado': 'Con entrada'
  }
};

// Utils
const Utils = {
  formatDate: (dateString) => {
    // Prevenimos que 'null' o 'undefined' se conviertan en 1970
    if (!dateString) {
      return 'Fecha Inválida';
    }
    // Forzar interpretación como fecha local (no UTC)
    const d = new Date(dateString + 'T00:00:00'); 
    
    // Comprobación de fecha inválida (NaN)
    if (isNaN(d.getDate())) {
      return 'Fecha Inválida';
    }
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  },
  formatTime: (time) => {
    if (!time) return '';
    const [hour, minute] = time.split(':');
    return `${hour}:${minute}`;
  },
  formatCurrency: (amount) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount);
  },
  escapeHtml: (unsafe) => {
    if (unsafe === null || unsafe === undefined) return '';
    return String(unsafe)
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
  },
  showToast: (message, type = 'info') => {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast show ${type}`;
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  },
  getToken: () => {
    return localStorage.getItem('token');
  },
  getUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },
  setAuth: (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  },
  clearAuth: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  isAuthenticated: () => {
    return !!Utils.getToken();
  }
};