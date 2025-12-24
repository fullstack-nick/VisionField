export type SuperResStartParams = {
  imageUri: string;
};

export type SuperResStartResult = {
  jobId: string;
};

export type SuperResProgress = {
  jobId: string;
  done: number;
  total: number;
  percent: number;
  message: string;
};

export type SuperResComplete = {
  jobId: string;
  enhancedUri: string;
  width: number;
  height: number;
};

export type SuperResError = {
  jobId: string;
  message: string;
};

export type SuperResCancelled = {
  jobId: string;
};
