
import { Project } from '../types';

const BIN_ID = '6920a82ed0ea881f40f73ecc';
const MASTER_KEY = '$2a$10$rvjSW.uRNLuZJNHOQepYQedUeVgRQeUKP1LQ2assDQUhHxmTtVu/G';
const BASE_URL = 'https://api.jsonbin.io/v3/b';

interface BinResponse {
  record: {
    projects: Project[];
  };
  metadata: any;
}

export const fetchProjectsFromBin = async (): Promise<Project[]> => {
  try {
    const response = await fetch(`${BASE_URL}/${BIN_ID}/latest`, {
      method: 'GET',
      headers: {
        'X-Master-Key': MASTER_KEY,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`${response.status} ${errorText}`);
    }

    const data: any = await response.json();
    // Check structure: { record: { projects: [] } } or { record: [] }
    if (data.record && Array.isArray(data.record.projects)) {
        return data.record.projects;
    } else if (Array.isArray(data.record)) {
        return data.record;
    }
    return [];
  } catch (error) {
    console.error('JSONBin Fetch Error:', error);
    throw error;
  }
};

export const saveProjectsToBin = async (projects: Project[]): Promise<boolean> => {
  try {
    const response = await fetch(`${BASE_URL}/${BIN_ID}`, {
      method: 'PUT',
      headers: {
        'X-Master-Key': MASTER_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ projects })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`${response.status} ${errorText}`);
    }

    return true;
  } catch (error) {
    console.error('JSONBin Save Error:', error);
    throw error;
  }
};
