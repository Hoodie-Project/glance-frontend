import { apiClient } from "@/api/client";
import type {
  CommentLikeToggleResponse,
  CreateCommentPayload,
  CreateCommentResponse,
  DeleteCommentPayload
} from "@/api/comment/type";

export type {
  CommentItem,
  CommentLikeToggleResponse,
  CreateCommentPayload,
  CreateCommentResponse,
  DeleteCommentPayload
} from "@/api/comment/type";

export function createComment(payload: CreateCommentPayload) {
  return apiClient<CreateCommentResponse>(`/api/threads/${payload.threadId}/comments`, {
    method: "POST",
    body: {
      nickname: payload.nickname,
      password: payload.password,
      content: payload.content
    }
  });
}

export function toggleCommentLike(threadId: number, commentId: number) {
  return apiClient<CommentLikeToggleResponse>(`/api/threads/${threadId}/comments/${commentId}/likes`, {
    method: "POST"
  });
}

export function deleteComment(threadId: number, commentId: number, payload: DeleteCommentPayload) {
  return apiClient<void>(`/api/threads/${threadId}/comments/${commentId}`, {
    method: "DELETE",
    body: payload
  });
}
