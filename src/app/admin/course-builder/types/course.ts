/* ================= ITEM TYPES ================= */

export type VideoItem = {
  type: "video";
  sessionId: string;
  name: string;
  videoId?: string | number;
  videoTitle?: string;
};

export type QuizItem = {
  type: "quiz";
  quizRefId: string;
  name: string;
  quizId?: string | number;
};

export type PdfItem = {
  type: "pdf";
  pdfId: string;
  name: string;
  fileUrl: string;
};

/* ✅ UNION TYPE */
export type ItemType = VideoItem | QuizItem | PdfItem;

/* ================= STRUCTURE ================= */

export type Submodule = {
  submoduleId: string;
  title: string;
  items: ItemType[];
};

export type Module = {
  moduleId: string;
  name: string;
  submodules: Submodule[];
};

/* ================= COURSE ================= */

export type Course = {
  id: string | number;
  name: string;
  slug?: string;

  courseData: {
    modules: Module[];
  };
};

/* ================= TARGET ================= */

export type TargetType = {
  moduleId: string;
  submoduleId: string;
};