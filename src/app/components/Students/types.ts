// components/Students/types.ts
export type StudentAPIResp = {
  id: number;
  name: string;
  email: string;
  phone?: string;
  courseSlug?: string;
  courseTitle?: string;
  modules?: string[] | string;
  progress?: Record<string, number[]>;
  batch_id?: string | number;
};

export type VideoItem = { id?: string; title?: string; url?: string };
export type Submodule = {
  submoduleId?: string;
  title?: string;
  description?: string;
  videos?: VideoItem[];
  thumbnail?: string;
};
export type Module = {
  moduleId?: string;
  slug?: string;
  name?: string;
  description?: string;
  moduleVideo?: string;
  submodules?: Submodule[];
};
export type CourseFile = {
  courseId?: string;
  slug?: string;
  name?: string;
  description?: string;
  modules?: Module[];
};