export type Course = {
  id: number;
  title: string;
  description: string;
  createdAt: string;
  totalLessons?: number;
  completedLessons?: number;
  progress?: number;
};

export type Lesson = {
  id: number;
  courseId: number;
  title: string;
  isCompleted: boolean;
  description?: string;
  createdAt: string;
};

export type CourseDetail = Course & {
  lessons: Lesson[];
};
