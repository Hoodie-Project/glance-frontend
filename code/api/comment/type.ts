export type CommentItem = {
  id: number;
  nickname: string;
  content: string;
  likeCount: number;
  createdAt: string;
};

export type CreateCommentPayload = {
  threadId: number;
  nickname: string;
  password?: string;
  content: string;
};

export type CreateCommentResponse = CommentItem & {
  generatedPassword: string | null;
};

export type CommentLikeToggleResponse = {
  liked: boolean;
  likeCount: number;
};

export type DeleteCommentPayload = {
  password: string;
};
