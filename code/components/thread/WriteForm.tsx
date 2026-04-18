"use client";

import { ChevronLeft, ChevronRight, RefreshCw, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type WriteFormProps = {
  currentLocation?: {
    lat: string;
    lng: string;
    name?: string;
  } | null;
};

type LocationValue = {
  lat: number;
  lng: number;
  name: string;
};

type FormErrors = Partial<
  Record<"title" | "content" | "location" | "nickname" | "password" | "gender" | "description", string>
>;

type DraftPayload = {
  title: string;
  content: string;
  location: LocationValue | null;
  nickname: string;
  password: string;
  tags: string[];
  gender: "male" | "female" | null;
  description: string | null;
};

const WRITE_DRAFT_KEY = "glance-write-draft";

const NICKNAME_PREFIXES = ["반짝", "몽글", "차분", "은밀", "포근", "낮잠", "초코", "소금", "도도", "호호"];
const NICKNAME_SUFFIXES = ["고양이", "토끼", "여우", "펭귄", "햄스터", "강아지", "곰돌이", "참새", "사슴", "다람쥐"];

const DESCRIPTION_GROUPS = [
  {
    label: "동물상",
    options: ["강아지", "고양이", "여우", "토끼", "공룡", "사슴", "늑대", "햄스터", "곰돌이"]
  },
  {
    label: "분위기 및 스타일",
    options: ["냉미남", "냉미녀", "온미남", "온미녀", "무해함", "퇴폐미", "정석미남", "정석미녀", "과즙상"]
  }
] as const;

function generateNickname() {
  const prefix = NICKNAME_PREFIXES[Math.floor(Math.random() * NICKNAME_PREFIXES.length)];
  const suffix = NICKNAME_SUFFIXES[Math.floor(Math.random() * NICKNAME_SUFFIXES.length)];
  const number = Math.floor(100 + Math.random() * 900);

  return `${prefix}${suffix}${number}`;
}

function generatePassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

function toLocationValue(currentLocation?: { lat: string; lng: string; name?: string } | null): LocationValue | null {
  if (!currentLocation) {
    return null;
  }

  const lat = Number(currentLocation.lat);
  const lng = Number(currentLocation.lng);

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return null;
  }

  return {
    lat,
    lng,
    name: currentLocation.name || `선택한 위치 (${lat.toFixed(5)}, ${lng.toFixed(5)})`
  };
}

function isEmpty(value: string) {
  return value.trim().length === 0;
}

function fieldStyle(hasError = false) {
  return {
    width: "100%",
    border: `1px solid ${hasError ? "#ff6b6b" : "var(--border)"}`,
    borderRadius: 18,
    background: "rgba(255,255,255,0.04)",
    color: "var(--foreground)",
    padding: 14,
    outline: "none" as const,
    boxShadow: hasError ? "0 0 0 1px rgba(255,107,107,0.28)" : "none"
  };
}

function fakeCreateThread() {
  return new Promise<void>((resolve) => {
    window.setTimeout(() => resolve(), 500);
  });
}

export function WriteForm({ currentLocation }: WriteFormProps) {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [location, setLocation] = useState<LocationValue | null>(null);
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [gender, setGender] = useState<"male" | "female" | null>(null);
  const [description, setDescription] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isTagEditorOpen, setIsTagEditorOpen] = useState(false);
  const [tagDraft, setTagDraft] = useState("");
  const [tempTags, setTempTags] = useState<string[]>([]);
  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const nextLocation = toLocationValue(currentLocation);
    const rawDraft = window.sessionStorage.getItem(WRITE_DRAFT_KEY);

    if (rawDraft) {
      try {
        const draft = JSON.parse(rawDraft) as DraftPayload;

        setTitle(draft.title ?? "");
        setContent(draft.content ?? "");
        setLocation(nextLocation ?? draft.location ?? null);
        if (nextLocation) {
          setErrors((prev) => ({ ...prev, location: undefined }));
        }
        setNickname(draft.nickname || generateNickname());
        setPassword(draft.password || generatePassword());
        setTags(Array.isArray(draft.tags) ? draft.tags : []);
        setGender(draft.gender ?? null);
        setDescription(draft.description ?? null);
        setIsInitialized(true);
        return;
      } catch {
        window.sessionStorage.removeItem(WRITE_DRAFT_KEY);
      }
    }

    setLocation(nextLocation);
    if (nextLocation) {
      setErrors((prev) => ({ ...prev, location: undefined }));
    }
    setNickname(generateNickname());
    setPassword(generatePassword());
    setIsInitialized(true);
  }, [currentLocation]);

  useEffect(() => {
    if (!isInitialized) {
      return;
    }

    const payload: DraftPayload = {
      title,
      content,
      location,
      nickname,
      password,
      tags,
      gender,
      description
    };

    window.sessionStorage.setItem(WRITE_DRAFT_KEY, JSON.stringify(payload));
  }, [content, description, gender, isInitialized, location, nickname, password, tags, title]);

  useEffect(() => {
    if (!snackbarMessage) {
      return;
    }

    const timer = window.setTimeout(() => {
      setSnackbarMessage(null);
    }, 2200);

    return () => window.clearTimeout(timer);
  }, [snackbarMessage]);

  const isDirty = useMemo(
    () =>
      !isEmpty(title) ||
      !isEmpty(content) ||
      !isEmpty(nickname) ||
      !isEmpty(password) ||
      tags.length > 0 ||
      Boolean(location) ||
      gender !== null ||
      description !== null,
    [content, description, gender, location, nickname, password, tags.length, title]
  );

  const isConfirmEnabled =
    !isEmpty(title) && !isEmpty(content) && location !== null && !isEmpty(password) && password.length >= 4;

  const handleOpenTagEditor = () => {
    setTempTags(tags);
    setTagDraft("");
    setIsTagEditorOpen(true);
  };

  const handleAddTag = () => {
    const nextTag = tagDraft.trim().replace(/^#+/, "");

    if (!nextTag) {
      setSnackbarMessage("유효한 값을 입력해주세요");
      return;
    }

    if (tempTags.length >= 5) {
      return;
    }

    if (tempTags.includes(nextTag)) {
      setSnackbarMessage("이미 추가된 태그입니다");
      return;
    }

    setTempTags((prev) => [...prev, nextTag]);
    setTagDraft("");
  };

  const validate = () => {
    const nextErrors: FormErrors = {};

    if (isEmpty(title)) {
      nextErrors.title = "제목을 입력해주세요.";
    } else if (title.length > 30) {
      nextErrors.title = "제목은 최대 30자까지 입력할 수 있습니다.";
    }

    if (isEmpty(content)) {
      nextErrors.content = "본문을 입력해주세요.";
    } else if (content.length > 500) {
      nextErrors.content = "본문은 최대 500자까지 입력할 수 있습니다.";
    }

    if (!location) {
      nextErrors.location = "장소를 선택해주세요.";
    }

    if (isEmpty(nickname)) {
      nextErrors.nickname = "닉네임을 입력해주세요.";
    }

    if (isEmpty(password)) {
      nextErrors.password = "비밀번호를 입력해주세요.";
    } else if (password.length < 4 || password.length > 8) {
      nextErrors.password = "비밀번호는 4자 이상 8자 이하여야 합니다.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleBack = () => {
    if (!isDirty) {
      router.back();
      return;
    }

    setIsLeaveModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!validate()) {
      return;
    }

    try {
      setIsSubmitting(true);
      await fakeCreateThread();
      window.sessionStorage.removeItem(WRITE_DRAFT_KEY);
      router.push("/feed");
    } catch {
      setSnackbarMessage("잠시 후 다시 시도해주세요");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <section className="surface" style={{ borderRadius: 28, padding: 20 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 18
          }}
        >
          <button className="chip" onClick={handleBack} type="button">
            <ChevronLeft size={16} />
            뒤로가기
          </button>
          <button
            className={isConfirmEnabled ? "button-primary" : "button-secondary"}
            disabled={!isConfirmEnabled || isSubmitting}
            onClick={handleSubmit}
            type="button"
            style={{ opacity: isConfirmEnabled && !isSubmitting ? 1 : 0.5 }}
          >
            확인
          </button>
        </div>

        <h1 style={{ margin: 0, fontSize: 24, letterSpacing: "-0.03em" }}>스레드 작성</h1>
        <p style={{ margin: "8px 0 0", color: "var(--muted)", lineHeight: 1.6 }}>
          필수 항목은 제목, 본문, 장소, 비밀번호입니다. 닉네임과 비밀번호는 랜덤값으로 시작하며 직접 수정할 수
          있습니다.
        </p>

        <div style={{ display: "grid", gap: 16, marginTop: 20 }}>
          <label style={{ display: "grid", gap: 8 }}>
            <span style={{ fontWeight: 700 }}>제목 *</span>
            <input
              maxLength={30}
              onChange={(event) => {
                setTitle(event.target.value);
                if (errors.title) setErrors((prev) => ({ ...prev, title: undefined }));
              }}
              placeholder="최대 30자"
              value={title}
              style={fieldStyle(Boolean(errors.title))}
            />
            <span style={{ color: errors.title ? "#ff8f8f" : "var(--muted)", fontSize: 13 }}>
              {errors.title ?? `${title.length}/30`}
            </span>
          </label>

          <label style={{ display: "grid", gap: 8 }}>
            <span style={{ fontWeight: 700 }}>본문 *</span>
            <textarea
              maxLength={500}
              onChange={(event) => {
                setContent(event.target.value);
                if (errors.content) setErrors((prev) => ({ ...prev, content: undefined }));
              }}
              placeholder="지금 보고 있는 상황을 자세히 적어주세요."
              rows={8}
              value={content}
              style={{ ...fieldStyle(Boolean(errors.content)), resize: "none", lineHeight: 1.6 }}
            />
            <span style={{ color: errors.content ? "#ff8f8f" : "var(--muted)", fontSize: 13 }}>
              {errors.content ?? `${content.length}/500`}
            </span>
          </label>

          <label style={{ display: "grid", gap: 8 }}>
            <span style={{ fontWeight: 700 }}>장소 *</span>
            <button
              onClick={() => {
                router.push("/map?select=1&returnTo=/write");
              }}
              type="button"
              style={{
                ...fieldStyle(Boolean(errors.location)),
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                cursor: "pointer",
                textAlign: "left"
              }}
            >
              <span style={{ color: location ? "var(--foreground)" : "var(--muted)" }}>
                {location ? location.name : "지도에서 장소 선택"}
              </span>
              <ChevronRight size={18} />
            </button>
            <span style={{ color: errors.location ? "#ff8f8f" : "var(--muted)", fontSize: 13 }}>
              {errors.location ?? "지도에서 선택한 좌표를 작성 위치로 사용합니다."}
            </span>
          </label>

          <label style={{ display: "grid", gap: 8 }}>
            <span style={{ fontWeight: 700 }}>닉네임</span>
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10 }}>
              <input
                onChange={(event) => {
                  setNickname(event.target.value);
                  if (errors.nickname) setErrors((prev) => ({ ...prev, nickname: undefined }));
                }}
                placeholder="닉네임을 입력해주세요"
                value={nickname}
                style={fieldStyle(Boolean(errors.nickname))}
              />
              <button
                className="button-secondary"
                onClick={() => setNickname(generateNickname())}
                type="button"
                style={{ whiteSpace: "nowrap" }}
              >
                <RefreshCw size={16} />
                추천
              </button>
            </div>
            <span style={{ color: errors.nickname ? "#ff8f8f" : "var(--muted)", fontSize: 13 }}>
              {errors.nickname ?? "랜덤 추천 닉네임을 수정해서 사용할 수 있습니다."}
            </span>
          </label>

          <label style={{ display: "grid", gap: 8 }}>
            <span style={{ fontWeight: 700 }}>비밀번호 *</span>
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10 }}>
              <input
                maxLength={8}
                onChange={(event) => {
                  setPassword(event.target.value);
                  if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                }}
                placeholder="4자 이상 8자 이하"
                value={password}
                style={fieldStyle(Boolean(errors.password))}
              />
              <button
                className="button-secondary"
                onClick={() => setPassword(generatePassword())}
                type="button"
                style={{ whiteSpace: "nowrap" }}
              >
                <RefreshCw size={16} />
                생성
              </button>
            </div>
            <span style={{ color: errors.password ? "#ff8f8f" : "var(--muted)", fontSize: 13 }}>
              {errors.password ?? `${password.length}/8`}
            </span>
          </label>

          <div style={{ display: "grid", gap: 8 }}>
            <span style={{ fontWeight: 700 }}>태그</span>
            <button
              onClick={handleOpenTagEditor}
              type="button"
              style={{
                ...fieldStyle(false),
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                cursor: "pointer",
                textAlign: "left"
              }}
            >
              <span style={{ color: tags.length > 0 ? "var(--foreground)" : "var(--muted)" }}>
                {tags.length > 0 ? tags.map((item) => `#${item}`).join(" ") : "#태그 입력 (최대 5개)"}
              </span>
              <ChevronRight size={18} />
            </button>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {tags.map((item) => (
                <span
                  key={item}
                  className="chip"
                  style={{ background: "var(--accent-soft)", borderColor: "rgba(143, 92, 255, 0.24)" }}
                >
                  #{item}
                </span>
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            <span style={{ fontWeight: 700 }}>힐끔 대상 성별</span>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[
                { label: "여", value: "female" as const },
                { label: "남", value: "male" as const }
              ].map((item) => (
                <button
                  key={item.value}
                  onClick={() => setGender(item.value)}
                  type="button"
                  style={{
                    ...fieldStyle(false),
                    background: gender === item.value ? "var(--accent-soft)" : "rgba(255,255,255,0.04)",
                    borderColor: gender === item.value ? "rgba(143, 92, 255, 0.36)" : "var(--border)",
                    cursor: "pointer"
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            <div>
              <span style={{ fontWeight: 700 }}>힐끔 대상 묘사</span>
              <p style={{ margin: "6px 0 0", color: "var(--muted)", fontSize: 13 }}>현재는 1개만 선택할 수 있습니다.</p>
            </div>
            <div style={{ display: "grid", gap: 12 }}>
              {DESCRIPTION_GROUPS.map((group) => (
                <div key={group.label} style={{ display: "grid", gap: 8 }}>
                  <strong style={{ fontSize: 14 }}>{group.label}</strong>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {group.options.map((item) => (
                      <button
                        key={item}
                        className="chip"
                        onClick={() => setDescription(item)}
                        type="button"
                        style={{
                          background: description === item ? "var(--accent-soft)" : "rgba(255,255,255,0.04)",
                          borderColor: description === item ? "rgba(143, 92, 255, 0.36)" : "var(--border)",
                          cursor: "pointer"
                        }}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {isTagEditorOpen ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 40,
            display: "grid",
            alignItems: "end",
            background: "rgba(0, 0, 0, 0.42)"
          }}
        >
          <button
            aria-label="태그 입력 닫기"
            onClick={() => setIsTagEditorOpen(false)}
            style={{ position: "absolute", inset: 0, border: 0, background: "transparent" }}
            type="button"
          />
          <div
            className="surface"
            onClick={(event) => event.stopPropagation()}
            style={{
              position: "relative",
              zIndex: 1,
              borderRadius: "28px 28px 0 0",
              padding: "18px 20px calc(env(safe-area-inset-bottom) + 24px)",
              background: "rgba(14, 16, 24, 0.96)"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <button className="chip" onClick={() => setIsTagEditorOpen(false)} type="button">
                취소
              </button>
              <strong style={{ fontSize: 18 }}>태그 입력</strong>
              <button
                className="button-primary"
                onClick={() => {
                  setTags(tempTags);
                  setIsTagEditorOpen(false);
                }}
                type="button"
              >
                확인
              </button>
            </div>

            <div style={{ display: "grid", gap: 12, marginTop: 18 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10 }}>
                <label
                  style={{
                    ...fieldStyle(false),
                    display: "flex",
                    alignItems: "center",
                    gap: 6
                  }}
                >
                  <span style={{ color: "var(--accent)", fontWeight: 700 }}>#</span>
                  <input
                    onChange={(event) => setTagDraft(event.target.value.replace(/^#+/, ""))}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        handleAddTag();
                      }
                    }}
                    placeholder="태그 입력 (최대 5개)"
                    value={tagDraft}
                    style={{
                      flex: 1,
                      border: 0,
                      outline: "none",
                      background: "transparent",
                      color: "var(--foreground)"
                    }}
                  />
                </label>
                <button
                  className={tagDraft.trim().length > 0 && tempTags.length < 5 ? "button-primary" : "button-secondary"}
                  disabled={tagDraft.trim().length === 0 || tempTags.length >= 5}
                  onClick={handleAddTag}
                  type="button"
                  style={{ opacity: tagDraft.trim().length > 0 && tempTags.length < 5 ? 1 : 0.5 }}
                >
                  +추가
                </button>
              </div>

              <div style={{ color: "var(--muted)", fontSize: 13 }}>최대 5개까지 등록할 수 있습니다.</div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {tempTags.map((item) => (
                  <span
                    key={item}
                    className="chip"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      background: "var(--accent-soft)",
                      borderColor: "rgba(143, 92, 255, 0.24)"
                    }}
                  >
                    #{item}
                    <button
                      aria-label={`${item} 삭제`}
                      onClick={() => setTempTags((prev) => prev.filter((value) => value !== item))}
                      style={{
                        display: "grid",
                        placeItems: "center",
                        width: 18,
                        height: 18,
                        border: 0,
                        borderRadius: 999,
                        background: "rgba(255,255,255,0.12)",
                        color: "var(--foreground)",
                        cursor: "pointer"
                      }}
                      type="button"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {isLeaveModalOpen ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 50,
            display: "grid",
            placeItems: "center",
            background: "rgba(0, 0, 0, 0.5)",
            padding: 20
          }}
        >
          <div className="surface" style={{ width: "100%", maxWidth: 360, borderRadius: 24, padding: 20 }}>
            <strong style={{ display: "block", fontSize: 18 }}>작성 중인 내용이 사라질 수 있습니다. 이동하시겠습니까?</strong>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 18 }}>
              <button className="button-secondary" onClick={() => setIsLeaveModalOpen(false)} type="button">
                취소
              </button>
              <button
                className="button-primary"
                onClick={() => {
                  setIsLeaveModalOpen(false);
                  window.sessionStorage.removeItem(WRITE_DRAFT_KEY);
                  router.back();
                }}
                type="button"
              >
                이동
              </button>
            </div>
          </div>
        </div>
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
