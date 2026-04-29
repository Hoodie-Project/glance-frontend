"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/api/client";
import { createComment, deleteComment, toggleCommentLike } from "@/api/comment";
import { deleteThread, getThread, toggleThreadLike } from "@/api/thread";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  HiChevronDown,
  HiDotsVertical,
  HiOutlineArrowLeft,
  HiOutlineChatAlt2,
  HiOutlineHeart,
  HiTrash
} from "react-icons/hi";

type ThreadDetailProps = {
  threadId: string;
};

type ActionSheetState =
  | null
  | { type: "thread-menu" }
  | { type: "delete-thread" }
  | { type: "delete-comment"; commentId: number };

function formatRelativeTime(value: string) {
  const date = new Date(value);
  const diffMinutes = Math.round((date.getTime() - Date.now()) / (1000 * 60));
  const formatter = new Intl.RelativeTimeFormat("ko", { numeric: "auto" });

  if (Math.abs(diffMinutes) < 60) {
    return formatter.format(diffMinutes, "minute").replace(" ", "");
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) {
    return formatter.format(diffHours, "hour").replace(" ", "");
  }

  const diffDays = Math.round(diffHours / 24);
  return formatter.format(diffDays, "day").replace(" ", "");
}

function resolveErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    const payload = error.payload;

    if (payload && typeof payload === "object") {
      if ("message" in payload && typeof payload.message === "string") {
        return payload.message;
      }

      if ("error" in payload && typeof payload.error === "string") {
        return payload.error;
      }
    }
  }

  return fallback;
}

export function ThreadDetail({ threadId }: ThreadDetailProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [comment, setComment] = useState("");
  const [commentNickname, setCommentNickname] = useState(() => {
    if (typeof window === "undefined") {
      return "";
    }

    const savedNickname = window.sessionStorage.getItem("glance-comment-nickname");

    if (savedNickname) {
      return savedNickname;
    }

    const generatedNickname = `익명${Math.floor(100 + Math.random() * 900)}`;
    window.sessionStorage.setItem("glance-comment-nickname", generatedNickname);
    return generatedNickname;
  });
  const [commentPassword, setCommentPassword] = useState("");
  const [actionSheet, setActionSheet] = useState<ActionSheetState>(null);
  const [deletePassword, setDeletePassword] = useState("");
  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);
  const numericThreadId = Number(threadId);

  useEffect(() => {
    if (!snackbarMessage) {
      return;
    }

    const timer = window.setTimeout(() => {
      setSnackbarMessage(null);
    }, 2400);

    return () => {
      window.clearTimeout(timer);
    };
  }, [snackbarMessage]);

  const { data, error, isLoading } = useQuery({
    queryKey: ["threadDetail", numericThreadId],
    queryFn: () => getThread(numericThreadId),
    enabled: Number.isFinite(numericThreadId)
  });

  const likeMutation = useMutation({
    mutationFn: () => toggleThreadLike(numericThreadId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["threadDetail", numericThreadId] });
      queryClient.invalidateQueries({ queryKey: ["feedThreads"] });
    },
    onError: (mutationError) => {
      setSnackbarMessage(resolveErrorMessage(mutationError, "좋아요 처리에 실패했습니다."));
    }
  });

  const commentMutation = useMutation({
    mutationFn: () =>
      createComment({
        threadId: numericThreadId,
        nickname: commentNickname || `익명${Math.floor(100 + Math.random() * 900)}`,
        content: comment.trim(),
        password: commentPassword.trim() || undefined
      }),
    onSuccess: (response) => {
      setComment("");
      setCommentPassword("");
      queryClient.invalidateQueries({ queryKey: ["threadDetail", numericThreadId] });
      queryClient.invalidateQueries({ queryKey: ["feedThreads"] });

      if (response.generatedPassword) {
        setSnackbarMessage(`댓글 비밀번호 ${response.generatedPassword}`);
      }
    },
    onError: (mutationError) => {
      setSnackbarMessage(resolveErrorMessage(mutationError, "댓글 등록에 실패했습니다."));
    }
  });

  const commentLikeMutation = useMutation({
    mutationFn: (commentId: number) => toggleCommentLike(numericThreadId, commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["threadDetail", numericThreadId] });
    },
    onError: (mutationError) => {
      setSnackbarMessage(resolveErrorMessage(mutationError, "댓글 좋아요 처리에 실패했습니다."));
    }
  });

  const deleteThreadMutation = useMutation({
    mutationFn: (password: string) => deleteThread(numericThreadId, { password }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feedThreads"] });
      setActionSheet(null);
      router.push("/feed");
    },
    onError: (mutationError) => {
      setSnackbarMessage(resolveErrorMessage(mutationError, "스레드 삭제에 실패했습니다."));
    }
  });

  const deleteCommentMutation = useMutation({
    mutationFn: ({ commentId, password }: { commentId: number; password: string }) =>
      deleteComment(numericThreadId, commentId, { password }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["threadDetail", numericThreadId] });
      queryClient.invalidateQueries({ queryKey: ["feedThreads"] });
      setActionSheet(null);
      setDeletePassword("");
    },
    onError: (mutationError) => {
      setSnackbarMessage(resolveErrorMessage(mutationError, "댓글 삭제에 실패했습니다."));
    }
  });

  const comments = useMemo(() => [...(data?.comments ?? [])].reverse(), [data?.comments]);
  const isDeleting = deleteThreadMutation.isPending || deleteCommentMutation.isPending;

  const handleLike = () => {
    likeMutation.mutate();
  };

  const handleSubmitComment = () => {
    if (!comment.trim()) return;

    if (!commentNickname.trim()) {
      setSnackbarMessage("댓글 닉네임을 준비하는 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    if (commentPassword.trim() && (commentPassword.trim().length < 4 || commentPassword.trim().length > 8)) {
      setSnackbarMessage("댓글 비밀번호는 4~8자여야 합니다.");
      return;
    }

    commentMutation.mutate();
  };

  const handleCommentLike = (commentId: number) => {
    commentLikeMutation.mutate(commentId);
  };

  const openDeleteSheet = (nextState: Exclude<ActionSheetState, null | { type: "thread-menu" }>) => {
    setDeletePassword("");
    setActionSheet(nextState);
  };

  const handleDeleteConfirm = () => {
    const trimmedPassword = deletePassword.trim();

    if (trimmedPassword.length < 4 || trimmedPassword.length > 8) {
      setSnackbarMessage("비밀번호 4~8자를 입력해주세요.");
      return;
    }

    if (actionSheet?.type === "delete-thread") {
      deleteThreadMutation.mutate(trimmedPassword);
      return;
    }

    if (actionSheet?.type === "delete-comment") {
      deleteCommentMutation.mutate({
        commentId: actionSheet.commentId,
        password: trimmedPassword
      });
    }
  };

  if (isLoading) {
    return (
      <section className="thread-detail-shell">
        <p style={{ margin: 0, color: "var(--muted)", textAlign: "center" }}>스레드를 불러오는 중입니다.</p>
      </section>
    );
  }

  if (error || !data) {
    return (
      <section className="thread-detail-shell">
        <p style={{ margin: 0, color: "#a26b6b", textAlign: "center" }}>스레드를 불러오지 못했습니다.</p>
      </section>
    );
  }

  return (
    <>
      <section className="thread-detail-shell">
        <div className="thread-detail-topbar">
          <button aria-label="뒤로가기" className="thread-detail-icon-button" onClick={() => router.push("/feed")} type="button">
            <HiOutlineArrowLeft size={28} />
          </button>
          <button
            aria-label="더보기"
            className="thread-detail-icon-button"
            onClick={() => setActionSheet({ type: "thread-menu" })}
            type="button"
          >
            <HiDotsVertical size={24} />
          </button>
        </div>

        <div className="thread-detail-header">
          <div className="thread-detail-author-row">
            <span className="thread-detail-avatar" />
            <strong className="thread-detail-author">{data.nickname}</strong>
            <span className="thread-detail-time">{formatRelativeTime(data.createdAt)}</span>
          </div>

          <h1 className="thread-detail-title">{data.title}</h1>

          <p className="thread-detail-body">{data.content}</p>

          <div className="thread-detail-tags">
            {data.tags.map((tag) => (
              <span key={tag}>#{tag}</span>
            ))}
          </div>

          <div className="thread-detail-stats">
            <button disabled={likeMutation.isPending} onClick={handleLike} type="button">
              <HiOutlineHeart size={30} />
              <span>{data.likeCount}</span>
            </button>
            <span>
              <HiOutlineChatAlt2 size={29} />
              <span>{data.commentCount}</span>
            </span>
          </div>
        </div>

        <button className="thread-comments-sort" type="button">
          최신순
          <HiChevronDown size={20} />
        </button>

        <div className="thread-comments-list">
          {comments.map((item) => (
            <div key={item.id} className="thread-comment-item">
              <div className="thread-comment-head">
                <div className="thread-detail-author-row">
                  <span className="thread-detail-avatar" />
                  <strong className="thread-detail-author">{item.nickname}</strong>
                  <span className="thread-detail-time">{formatRelativeTime(item.createdAt)}</span>
                </div>
                <button
                  className="thread-comment-delete"
                  onClick={() => openDeleteSheet({ type: "delete-comment", commentId: item.id })}
                  type="button"
                >
                  삭제
                </button>
              </div>
              <p className="thread-comment-body">{item.content}</p>
              <button
                className="thread-comment-like"
                disabled={commentLikeMutation.isPending}
                onClick={() => handleCommentLike(item.id)}
                type="button"
              >
                <HiOutlineHeart size={30} />
                <span>{item.likeCount}</span>
              </button>
            </div>
          ))}
        </div>

        <div className="thread-comment-form">
          <input
            maxLength={20}
            onChange={(event) => {
              setCommentNickname(event.target.value);
              window.sessionStorage.setItem("glance-comment-nickname", event.target.value);
            }}
            placeholder="댓글 닉네임"
            style={{
              width: "100%",
              minHeight: 48,
              border: "1px solid rgba(17, 17, 17, 0.08)",
              borderRadius: 18,
              background: "#fff",
              color: "#111",
              padding: "0 14px"
            }}
            type="text"
            value={commentNickname}
          />
          <textarea
            placeholder="댓글을 입력하세요"
            rows={4}
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            style={{
              width: "100%",
              border: "1px solid rgba(17, 17, 17, 0.08)",
              borderRadius: 18,
              background: "#fff",
              color: "#111",
              padding: 14,
              resize: "vertical"
            }}
          />
          <input
            maxLength={8}
            onChange={(event) => setCommentPassword(event.target.value)}
            placeholder="댓글 비밀번호 4~8자 (선택)"
            style={{
              width: "100%",
              minHeight: 48,
              border: "1px solid rgba(17, 17, 17, 0.08)",
              borderRadius: 18,
              background: "#fff",
              color: "#111",
              padding: "0 14px"
            }}
            type="password"
            value={commentPassword}
          />
          <button className="button-primary" disabled={commentMutation.isPending} onClick={handleSubmitComment} type="button">
            댓글 등록
          </button>
        </div>
      </section>

      {actionSheet ? (
        <>
          <button className="thread-action-sheet-backdrop" onClick={() => setActionSheet(null)} type="button" />
          <div className="thread-action-sheet" onClick={(event) => event.stopPropagation()}>
            <div className="thread-action-sheet-handle" />

            {actionSheet.type === "thread-menu" ? (
              <div className="thread-action-sheet-content">
                <strong className="thread-action-sheet-title">스레드 관리</strong>
                <button className="thread-action-sheet-button danger" onClick={() => openDeleteSheet({ type: "delete-thread" })} type="button">
                  <HiTrash size={18} />
                  스레드 삭제
                </button>
              </div>
            ) : (
              <div className="thread-action-sheet-content">
                <strong className="thread-action-sheet-title">
                  {actionSheet.type === "delete-thread" ? "스레드를 삭제할까요?" : "댓글을 삭제할까요?"}
                </strong>
                <p className="thread-action-sheet-description">삭제하려면 작성 시 사용한 비밀번호를 입력해주세요.</p>
                <input
                  className="thread-action-sheet-input"
                  maxLength={8}
                  onChange={(event) => setDeletePassword(event.target.value)}
                  placeholder="비밀번호 4~8자"
                  type="password"
                  value={deletePassword}
                />
                <div className="thread-action-sheet-actions">
                  <button className="button-secondary" onClick={() => setActionSheet(null)} type="button">
                    취소
                  </button>
                  <button className="button-primary" disabled={isDeleting} onClick={handleDeleteConfirm} type="button">
                    삭제
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      ) : null}

      {snackbarMessage ? (
        <div
          style={{
            position: "fixed",
            left: "50%",
            bottom: "max(20px, env(safe-area-inset-bottom))",
            zIndex: 60,
            minWidth: 220,
            maxWidth: "calc(100% - 32px)",
            padding: "12px 16px",
            borderRadius: 999,
            background: "rgba(17, 17, 17, 0.94)",
            color: "#fff",
            textAlign: "center",
            transform: "translateX(-50%)",
            boxShadow: "0 12px 28px rgba(0, 0, 0, 0.22)"
          }}
        >
          {snackbarMessage}
        </div>
      ) : null}
    </>
  );
}
