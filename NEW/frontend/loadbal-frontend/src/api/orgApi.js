import axios from "axios";

const API_BASE = "https://api-gateway-platform.onrender.com/api/orgs";

//https://api-gateway-platform.onrender.com
//http://localhost:5000

export const getOrgs = async () => {
  return axios.get(API_BASE);
};

export const createOrg = async (data) => {
  return axios.post(API_BASE, data);
};

export const addServer = async (orgId, data) => {
  return axios.post(`${API_BASE}/${orgId}/servers`, data);
};

export const updateServer = async (orgId, serverId, data) => {
  return axios.put(`${API_BASE}/${orgId}/servers/${serverId}`, data);
};

export const removeServer = async (orgId, serverId) => {
  return axios.delete(`${API_BASE}/${orgId}/servers/${serverId}`);
};