export type EnhanceStartParams = {
  imageUri: string;
};

export type EnhanceProgress = {
  jobId: string;
  done: number;
  total: number;
  percent: number;
  message: string;
};

export type EnhanceComplete = {
  jobId: string;
  enhancedUri: string;
  width: number;
  height: number;
};

export type EnhanceError = {
  jobId: string;
  message: string;
};

export type EnhanceCancelled = {
  jobId: string;
};
