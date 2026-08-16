import type { Course, CourseDetail, Lesson } from './types';

// C1: Vite dev proxy rewrites /api/* → http://localhost:4000/*
// Override with VITE_API_URL for Docker/production builds.
export const API_BASE = import.meta.env.VITE_API_URL ?? '/api';

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);

  if (options.body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let message = response.statusText;

    try {
      const body: unknown = await response.json();
      if (
        body !== null &&
        typeof body === 'object' &&
        'error' in body &&
        typeof body.error === 'string'
      ) {
        message = body.error;
      }
    } catch {
      // Non-JSON error body — keep statusText.
    }

    throw new ApiError(response.status, message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export function getCourses(): Promise<Course[]> {
  return request<Course[]>('/courses');
}

export function getCourse(id: number): Promise<CourseDetail> {
  return request<CourseDetail>(`/courses/${id}`);
}

export function createCourse(data: {
  title: string;
  description?: string;
}): Promise<Course> {
  return request<Course>('/courses', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateCourse(
  id: number,
  data: { title?: string; description?: string },
): Promise<Course> {
  return request<Course>(`/courses/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export function deleteCourse(id: number): Promise<void> {
  return request<void>(`/courses/${id}`, { method: 'DELETE' });
}

export function getLessons(courseId: number): Promise<Lesson[]> {
  return request<Lesson[]>(`/courses/${courseId}/lessons`);
}

export function createLesson(
  courseId: number,
  data: { title: string; description?: string },
): Promise<Lesson> {
  return request<Lesson>(`/courses/${courseId}/lessons`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateLesson(
  id: number,
  data: { isCompleted?: boolean; title?: string; description?: string },
): Promise<Lesson> {
  return request<Lesson>(`/lessons/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export function deleteLesson(id: number): Promise<void> {
  return request<void>(`/lessons/${id}`, { method: 'DELETE' });
}
