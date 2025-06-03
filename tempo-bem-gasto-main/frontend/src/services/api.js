import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000'
});

// Oportunidades
export const fetchOpportunities = () => API.get('/oportunidades');
export const createOpportunity = (data) => API.post('/ongs/oportunidades', data);

// Voluntários
export const fetchVolunteers = () => API.get('/voluntarios');
export const fetchVolunteerById = (id) => API.get(`/voluntarios/${id}`);

// Inscrições
export const submitApplication = (data) => API.post('/inscricoes', data);
export const updateApplicationStatus = (id, status) => 
  API.patch(`/inscricoes/${id}`, { status });
export const fetchApplications = () => API.get('/inscricoes');

// ONGs
export const fetchNGOs = () => API.get('/ongs');
