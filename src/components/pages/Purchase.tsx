import React, { useState, useEffect } from "react";
import LottoNumberBall from "../shared/LottoNumberBall";

interface PurchaseItem {
  id: number;
  numbers: number[];
  strategy: string;
  date: string;
  checked: boolean;
  status: "saved" | "favorite" | "checked";
  memo?: string;
  purchaseDate?: string;
}

interface PurchaseProps {
  purchaseHistory: PurchaseItem[];
  onDelete: (id: number) => void;
  onCheck: (id: number, numbers: number[]) => void;
  onAdd: (numbers: number[], strategy: string) => void;
  pastWinningNumbers: number[][];
  theme?: "light" | "dark";
}

interface CheckResult {
  grade: string;
  matches: number;
  bonusMatch: boolean;
  status: "winning" | "losing" | "pending"; // 추첨전 상태 추가
  drawDate?: string; // 추첨일 정보 추가
  message?: string; // 추가 메시지
}

const Purchase: React.FC<PurchaseProps> = ({
  purchaseHistory,
  onDelete,
  onCheck,
  onAdd,
  pastWinningNumbers,
  theme = "light",
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);

  const [isAutoSelect, setIsAutoSelect] = useState(false);
  const [filter, setFilter] = useState<
    "all" | "saved" | "favorite" | "checked"
  >("all");
  const [localHistory, setLocalHistory] = useState(purchaseHistory);

  // 다크 모드 색상 테마 - 수정된 버전
  const colors = {
    light: {
      background: "#f9fafb",
      surface: "#ffffff",
      primary: "#2563eb",
      text: "#1f2937",
      textSecondary: "#6b7280",
      border: "#e5e7eb",
      accent: "#059669",
      success: "#f0fdf4",
      successBorder: "#bbf7d0",
      successText: "#166534",
      info: "#eff6ff",
      infoBorder: "#bfdbfe",
      infoText: "#1e40af",
      warning: "#fefce8",
      warningBorder: "#fef3c7",
      warningText: "#92400e",
      error: "#fef2f2",
      errorBorder: "#fecaca",
      errorText: "#dc2626",
      gray: "#f9fafb",
      grayBorder: "#e5e7eb",
      red: "#fee2e2",
      redBorder: "#fecaca",
      redText: "#dc2626",
      // 추첨전 상태 색상 추가
      pending: "#f0f9ff",
      pendingBorder: "#bfdbfe",
      pendingText: "#1e40af",
    },
    dark: {
      background: "#0f172a",
      surface: "#1e293b",
      primary: "#3b82f6",
      text: "#f1f5f9",
      textSecondary: "#94a3b8",
      border: "#334155",
      accent: "#10b981",
      success: "#134e4a",
      successBorder: "#047857",
      successText: "#6ee7b7",
      info: "#1e3a8a",
      infoBorder: "#3b82f6",
      infoText: "#93c5fd",
      warning: "#451a03",
      warningBorder: "#d97706",
      warningText: "#fbbf24",
      error: "#7f1d1d",
      errorBorder: "#dc2626",
      errorText: "#fca5a5",
      gray: "#334155",
      grayBorder: "#475569",
      red: "#7f1d1d",
      redBorder: "#dc2626",
      redText: "#fca5a5",
      // 추첨전 상태 색상 추가 (다크모드)
      pending: "#1e3a8a",
      pendingBorder: "#3b82f6",
      pendingText: "#93c5fd",
    },
  };

  const currentColors = colors[theme];

  // purchaseHistory가 변경되면 localHistory 업데이트
  useEffect(() => {
    setLocalHistory(purchaseHistory);
  }, [purchaseHistory]);

  // 📅 등록일 기준으로 다음 추첨일 계산 (매주 토요일)
  const getNextDrawDate = (registrationDate: string): Date => {
    const regDate = new Date(registrationDate);
    const dayOfWeek = regDate.getDay(); // 0: 일요일, 6: 토요일

    // 등록일 이후 다음 토요일 계산
    let daysUntilSaturday = (6 - dayOfWeek) % 7;
    if (daysUntilSaturday === 0 && regDate.getHours() >= 20) {
      // 토요일 오후 8시 이후라면 다음 주 토요일
      daysUntilSaturday = 7;
    }
    if (daysUntilSaturday === 0) {
      // 토요일이지만 추첨 전이라면 당일
      daysUntilSaturday = 0;
    }

    const drawDate = new Date(regDate);
    drawDate.setDate(regDate.getDate() + daysUntilSaturday);
    drawDate.setHours(20, 45, 0, 0); // 오후 8시 45분

    return drawDate;
  };

  // 📅 추첨일이 지났는지 확인
  const isDrawCompleted = (drawDate: Date): boolean => {
    const now = new Date();
    return now > drawDate;
  };

  // 📅 날짜 형식 변환 함수 개선
  const parseRegistrationDate = (dateStr: string): Date => {
    // "2025.7.2" 또는 "2025-07-02" 형식 처리
    if (dateStr.includes(".")) {
      const [year, month, day] = dateStr.split(".").map(Number);
      return new Date(year, month - 1, day); // month는 0-based
    } else if (dateStr.includes("-")) {
      return new Date(dateStr);
    } else if (dateStr.includes("/")) {
      return new Date(dateStr);
    } else {
      // 기본적으로 한국 날짜 형식으로 파싱 시도
      return new Date(dateStr);
    }
  };

  // 상태 변경 함수
  const changeItemStatus = (
    id: number,
    newStatus: "saved" | "favorite" | "checked"
  ) => {
    const updatedHistory = localHistory.map((item) =>
      item.id === id ? { ...item, status: newStatus } : item
    );
    setLocalHistory(updatedHistory);
  };

  // AI 추천번호들
  const aiRecommendedNumbers = [
    {
      name: "1등 - AI 완벽분석",
      numbers: [2, 8, 14, 21, 29, 35],
      grade: "1등",
    },
    {
      name: "1등 - 황금비율 조합",
      numbers: [5, 11, 17, 23, 31, 42],
      grade: "1등",
    },
    {
      name: "2등 - 보너스 고려",
      numbers: [7, 13, 19, 25, 33, 39],
      grade: "2등",
    },
    { name: "3등 - 균형 분석", numbers: [3, 9, 16, 27, 34, 41], grade: "3등" },
    { name: "4등 - 패턴 분석", numbers: [1, 12, 18, 26, 32, 44], grade: "4등" },
  ];

  // 번호 선택/해제
  const toggleNumber = (num: number) => {
    if (isAutoSelect) return;

    setSelectedNumbers((prev) => {
      if (prev.includes(num)) {
        return prev.filter((n) => n !== num);
      } else if (prev.length < 6) {
        return [...prev, num].sort((a, b) => a - b);
      }
      return prev;
    });
  };

  // 자동선택 토글
  const toggleAutoSelect = () => {
    setIsAutoSelect(!isAutoSelect);
    if (!isAutoSelect) {
      const numbers = new Set<number>();
      while (numbers.size < 6) {
        numbers.add(Math.floor(Math.random() * 45) + 1);
      }
      setSelectedNumbers(Array.from(numbers).sort((a, b) => a - b));
    } else {
      setSelectedNumbers([]);
    }
  };

  // AI 추천번호 적용
  const applyRecommendedNumbers = (numbers: number[]) => {
    setSelectedNumbers([...numbers]);
    setIsAutoSelect(false);
  };

  // 번호 저장
  const saveNumbers = () => {
    if (selectedNumbers.length === 6) {
      let strategyName = "";
      if (isAutoSelect) {
        strategyName = "자동 생성";
      } else if (
        aiRecommendedNumbers.some(
          (rec) =>
            JSON.stringify(rec.numbers) === JSON.stringify(selectedNumbers)
        )
      ) {
        const matchedRec = aiRecommendedNumbers.find(
          (rec) =>
            JSON.stringify(rec.numbers) === JSON.stringify(selectedNumbers)
        );
        strategyName = matchedRec?.name || "AI 추천";
      } else {
        strategyName = "수동 선택";
      }

      onAdd(selectedNumbers, strategyName);
      setSelectedNumbers([]);
      setIsAutoSelect(false);
      setShowAddForm(false);
    }
  };

  // 🎯 당첨 확인 로직 개선 (추첨일 확인 포함)
  const checkWinning = (
    userNumbers: number[],
    registrationDate: string
  ): CheckResult => {
    try {
      // 등록일 파싱
      const regDate = parseRegistrationDate(registrationDate);
      const drawDate = getNextDrawDate(registrationDate);
      const isCompleted = isDrawCompleted(drawDate);

      // 추첨일 정보
      const drawDateStr = drawDate.toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "long",
      });

      // 📅 추첨일이 지나지 않았으면 "추첨전" 상태 반환
      if (!isCompleted) {
        const now = new Date();
        const diffTime = drawDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        let timeMessage = "";
        if (diffDays === 0) {
          timeMessage = "오늘 오후 8시 45분 추첨";
        } else if (diffDays === 1) {
          timeMessage = "내일 추첨";
        } else {
          timeMessage = `${diffDays}일 후 추첨`;
        }

        return {
          grade: "추첨전",
          matches: 0,
          bonusMatch: false,
          status: "pending",
          drawDate: drawDateStr,
          message: timeMessage,
        };
      }

      // 🎯 추첨일이 지났으면 실제 당첨 확인
      const latestWinning = pastWinningNumbers[0];
      const mainNumbers = latestWinning.slice(0, 6);
      const bonusNumber = latestWinning[6];

      const matches = userNumbers.filter((num) =>
        mainNumbers.includes(num)
      ).length;
      const bonusMatch = userNumbers.includes(bonusNumber);

      let grade = "";
      if (matches === 6) grade = "1등";
      else if (matches === 5 && bonusMatch) grade = "2등";
      else if (matches === 5) grade = "3등";
      else if (matches === 4) grade = "4등";
      else if (matches === 3) grade = "5등";
      else grade = "낙첨";

      return {
        grade,
        matches,
        bonusMatch,
        status: grade !== "낙첨" ? "winning" : "losing",
        drawDate: drawDateStr,
        message: `${matches}개 일치${bonusMatch ? " + 보너스" : ""}`,
      };
    } catch (error) {
      console.error("당첨 확인 중 오류:", error);
      return {
        grade: "확인불가",
        matches: 0,
        bonusMatch: false,
        status: "losing",
        message: "날짜 형식 오류",
      };
    }
  };

  // 번호 복사
  const copyNumbers = (numbers: number[]) => {
    const text = numbers.join(", ");
    navigator.clipboard.writeText(text);
    alert("번호가 복사되었습니다!");
  };

  // 당첨확인 결과 메시지 생성
  const getCheckedFilterMessage = () => {
    const checkedItems = localHistory.filter(
      (item) => item.status === "checked"
    );

    if (checkedItems.length === 0) {
      return {
        icon: "🔍",
        title: "당첨 확인할 번호가 없어요",
        description: "번호를 등록하고 당첨확인을 해보세요!",
      };
    }

    const results = checkedItems.map((item) =>
      checkWinning(item.numbers, item.date)
    );
    const winners = results.filter((result) => result.status === "winning");
    const pending = results.filter((result) => result.status === "pending");

    if (pending.length > 0) {
      return {
        icon: "⏰",
        title: `${pending.length}개 번호가 추첨 대기중입니다`,
        description: "추첨일이 되면 결과를 확인할 수 있어요!",
      };
    }

    if (winners.length > 0) {
      const bestWinner = winners.reduce((best, current) => {
        const gradeOrder = { "1등": 1, "2등": 2, "3등": 3, "4등": 4, "5등": 5 };
        return gradeOrder[current.grade as keyof typeof gradeOrder] <
          gradeOrder[best.grade as keyof typeof gradeOrder]
          ? current
          : best;
      });

      return {
        icon: "🎉",
        title: `축하합니다! ${bestWinner.grade} 당첨입니다!`,
        description: bestWinner.message || "",
      };
    } else {
      return {
        icon: "😔",
        title: "아쉽네요, 낙첨입니다",
        description: "다음 회차에 도전해보세요!",
      };
    }
  };

  // 필터링
  const filteredHistory = localHistory.filter((item) => {
    if (filter === "all") return true;
    return item.status === filter;
  });

  // 통계
  const stats = {
    total: localHistory.length,
    saved: localHistory.filter((item) => item.status === "saved").length,
    favorite: localHistory.filter((item) => item.status === "favorite").length,
    checked: localHistory.filter((item) => item.status === "checked").length,
  };

  return (
    <div style={{ padding: "12px" }}>
      {/* 헤더 */}
      <div
        style={{
          backgroundColor: currentColors.surface,
          padding: "16px",
          borderRadius: "12px",
          border: `1px solid ${currentColors.border}`,
          marginBottom: "12px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        }}
      >
        <h2
          style={{
            fontSize: "20px",
            fontWeight: "700",
            color: currentColors.text,
            margin: "0 0 8px 0",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          🗂️ 로또수첩
        </h2>
        <p
          style={{
            fontSize: "14px",
            color: currentColors.textSecondary,
            margin: "0 0 16px 0",
          }}
        >
          나만의 로또 번호를 기록하고 당첨을 확인하세요
        </p>

        {/* 통계 (클릭 가능한 필터 버튼으로 변경) */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
          <button
            onClick={() => setFilter("all")}
            style={{
              flex: 1,
              padding: "12px 8px",
              backgroundColor:
                filter === "all" ? currentColors.gray : currentColors.surface,
              borderRadius: "8px",
              textAlign: "center",
              border:
                filter === "all"
                  ? `2px solid ${currentColors.textSecondary}`
                  : `1px solid ${currentColors.border}`,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            <p
              style={{
                fontSize: "18px",
                fontWeight: "bold",
                color: currentColors.text,
                margin: "0",
              }}
            >
              {stats.total}
            </p>
            <p
              style={{
                fontSize: "12px",
                color: currentColors.textSecondary,
                margin: "0",
              }}
            >
              전체
            </p>
          </button>
          <button
            onClick={() => setFilter("saved")}
            style={{
              flex: 1,
              padding: "12px 8px",
              backgroundColor:
                filter === "saved"
                  ? theme === "dark"
                    ? "#1e3a8a"
                    : "#bfdbfe"
                  : theme === "dark"
                  ? "#1e293b"
                  : "#dbeafe",
              borderRadius: "8px",
              textAlign: "center",
              border:
                filter === "saved"
                  ? `2px solid ${currentColors.primary}`
                  : `1px solid ${currentColors.border}`,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            <p
              style={{
                fontSize: "18px",
                fontWeight: "bold",
                color: currentColors.primary,
                margin: "0",
              }}
            >
              {stats.saved}
            </p>
            <p
              style={{
                fontSize: "12px",
                color: currentColors.primary,
                margin: "0",
              }}
            >
              저장
            </p>
          </button>
          <button
            onClick={() => setFilter("favorite")}
            style={{
              flex: 1,
              padding: "12px 8px",
              backgroundColor:
                filter === "favorite"
                  ? theme === "dark"
                    ? "#451a03"
                    : "#fbbf24"
                  : theme === "dark"
                  ? "#451a03"
                  : "#fcd34d",
              borderRadius: "8px",
              textAlign: "center",
              border:
                filter === "favorite"
                  ? "2px solid #f59e0b"
                  : `1px solid ${currentColors.border}`,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            <p
              style={{
                fontSize: "18px",
                fontWeight: "bold",
                color: "#92400e",
                margin: "0",
              }}
            >
              {stats.favorite}
            </p>
            <p style={{ fontSize: "12px", color: "#92400e", margin: "0" }}>
              즐겨찾기
            </p>
          </button>
          <button
            onClick={() => setFilter("checked")}
            style={{
              flex: 1,
              padding: "12px 8px",
              backgroundColor:
                filter === "checked"
                  ? theme === "dark"
                    ? "#134e4a"
                    : "#86efac"
                  : theme === "dark"
                  ? "#134e4a"
                  : "#bbf7d0",
              borderRadius: "8px",
              textAlign: "center",
              border:
                filter === "checked"
                  ? "2px solid #10b981"
                  : `1px solid ${currentColors.border}`,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            <p
              style={{
                fontSize: "18px",
                fontWeight: "bold",
                color: "#15803d",
                margin: "0",
              }}
            >
              {stats.checked}
            </p>
            <p style={{ fontSize: "12px", color: "#15803d", margin: "0" }}>
              당첨확인
            </p>
          </button>
        </div>

        {/* 새 번호 등록 토글 버튼 */}
        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            style={{
              width: "100%",
              backgroundColor: currentColors.primary,
              color: "white",
              padding: "12px",
              borderRadius: "8px",
              border: "none",
              fontSize: "16px",
              fontWeight: "600",
              cursor: "pointer",
              boxShadow: "0 1px 3px rgba(37, 99, 235, 0.3)",
            }}
          >
            + 새 번호 등록하기
          </button>
        )}
      </div>

      {/* 실제 로또용지 스타일 번호 등록 폼 */}
      {showAddForm && (
        <div
          style={{
            backgroundColor: currentColors.surface,
            padding: "20px",
            borderRadius: "12px",
            border: `1px solid ${currentColors.border}`,
            marginBottom: "12px",
            boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
          }}
        >
          {/* 로또 용지 헤더 */}
          <div
            style={{
              textAlign: "center",
              marginBottom: "16px",
              padding: "12px",
              backgroundColor: currentColors.red,
              color: currentColors.redText,
              borderRadius: "8px",
              border: `2px solid ${currentColors.redBorder}`,
            }}
          >
            <h3
              style={{
                fontSize: "18px",
                fontWeight: "bold",
                margin: "0 0 4px 0",
              }}
            >
              🏮 Lotto 6/45
            </h3>
            <p
              style={{
                fontSize: "12px",
                margin: "0",
                opacity: 0.9,
              }}
            >
              구매용지 | 1~45번 중 서로 다른 6개 번호 선택
            </p>
          </div>

          {/* A게임 */}
          <div
            style={{
              backgroundColor: currentColors.surface,
              padding: "16px",
              borderRadius: "8px",
              border: `2px solid ${currentColors.redBorder}`,
              marginBottom: "12px",
            }}
          >
            {/* 게임 헤더 */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "12px",
                padding: "8px",
                backgroundColor: "#dc2626",
                color: "white",
                borderRadius: "4px",
                fontWeight: "bold",
                fontSize: "14px",
              }}
            >
              A 게임 | 1,000원
            </div>

            {/* 실제 로또 용지 번호 배치 */}
            <div
              style={{
                backgroundColor: currentColors.surface,
                padding: "12px",
                borderRadius: "6px",
                border: `1px solid ${currentColors.border}`,
              }}
            >
              {/* 7행 번호 배치 */}
              {[
                Array.from({ length: 7 }, (_, i) => i + 1), // 1-7
                Array.from({ length: 7 }, (_, i) => i + 8), // 8-14
                Array.from({ length: 7 }, (_, i) => i + 15), // 15-21
                Array.from({ length: 7 }, (_, i) => i + 22), // 22-28
                Array.from({ length: 7 }, (_, i) => i + 29), // 29-35
                Array.from({ length: 7 }, (_, i) => i + 36), // 36-42
                [43, 44, 45], // 43-45
              ].map((row, rowIndex) => (
                <div
                  key={rowIndex}
                  style={{
                    display: "flex",
                    gap: "3px",
                    marginBottom: "4px",
                    justifyContent: "center",
                  }}
                >
                  {row.map((num) => (
                    <button
                      key={num}
                      onClick={() => toggleNumber(num)}
                      disabled={isAutoSelect}
                      style={{
                        width: "32px",
                        height: "28px",
                        borderRadius: "4px",
                        border: selectedNumbers.includes(num)
                          ? "2px solid #dc2626"
                          : `1px solid ${currentColors.border}`,
                        backgroundColor: selectedNumbers.includes(num)
                          ? "#dc2626"
                          : currentColors.surface,
                        color: selectedNumbers.includes(num)
                          ? "white"
                          : currentColors.text,
                        fontSize: "11px",
                        fontWeight: selectedNumbers.includes(num)
                          ? "bold"
                          : "normal",
                        cursor: isAutoSelect ? "not-allowed" : "pointer",
                        opacity: isAutoSelect ? 0.6 : 1,
                      }}
                    >
                      {num}
                    </button>
                  ))}
                  {/* 43-45 행의 빈 공간 채우기 */}
                  {rowIndex === 6 &&
                    Array.from({ length: 4 }).map((_, i) => (
                      <div
                        key={`empty-${i}`}
                        style={{ width: "32px", height: "28px" }}
                      />
                    ))}
                </div>
              ))}

              {/* 자동선택 체크박스 */}
              <div
                style={{
                  marginTop: "12px",
                  padding: "8px",
                  backgroundColor: currentColors.red,
                  borderRadius: "4px",
                  border: `1px solid ${currentColors.redBorder}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
              >
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    cursor: "pointer",
                    fontSize: "12px",
                    fontWeight: "600",
                    color: currentColors.redText,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isAutoSelect}
                    onChange={toggleAutoSelect}
                    style={{
                      width: "16px",
                      height: "16px",
                      accentColor: "#dc2626",
                    }}
                  />
                  🎲 자동선택
                </label>
                <span
                  style={{
                    fontSize: "10px",
                    color: currentColors.redText,
                    marginLeft: "8px",
                    opacity: 0.8,
                  }}
                >
                  (컴퓨터가 자동으로 번호 선택)
                </span>
              </div>
            </div>

            {/* 선택된 번호 표시 */}
            {selectedNumbers.length > 0 && (
              <div
                style={{
                  marginTop: "12px",
                  padding: "12px",
                  backgroundColor: isAutoSelect
                    ? currentColors.success
                    : currentColors.info,
                  borderRadius: "6px",
                  border: isAutoSelect
                    ? `1px solid ${currentColors.successBorder}`
                    : `1px solid ${currentColors.infoBorder}`,
                }}
              >
                <div style={{ textAlign: "center", marginBottom: "8px" }}>
                  <p
                    style={{
                      fontSize: "12px",
                      fontWeight: "600",
                      color: isAutoSelect
                        ? currentColors.successText
                        : currentColors.infoText,
                      margin: "0",
                    }}
                  >
                    {isAutoSelect ? "🎲 자동 선택된 번호" : "✅ 선택한 번호"} (
                    {selectedNumbers.length}/6)
                  </p>
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: "6px",
                    justifyContent: "center",
                    flexWrap: "wrap",
                  }}
                >
                  {selectedNumbers.map((num, i) => (
                    <LottoNumberBall key={i} number={num} size="sm" />
                  ))}
                  {/* 빈 칸들 */}
                  {Array.from({ length: 6 - selectedNumbers.length }).map(
                    (_, i) => (
                      <div
                        key={`empty-${i}`}
                        style={{
                          width: "28px",
                          height: "28px",
                          borderRadius: "50%",
                          backgroundColor: currentColors.gray,
                          border: `2px dashed ${currentColors.grayBorder}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "12px",
                          color: currentColors.textSecondary,
                        }}
                      >
                        ?
                      </div>
                    )
                  )}
                </div>
                {selectedNumbers.length === 6 && (
                  <div style={{ textAlign: "center", marginTop: "8px" }}>
                    <span
                      style={{
                        fontSize: "11px",
                        color: isAutoSelect
                          ? currentColors.successText
                          : currentColors.infoText,
                        fontWeight: "600",
                      }}
                    >
                      ✅ 6개 번호 선택 완료!
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* AI 추천번호 섹션 */}
          <div
            style={{
              marginBottom: "16px",
              padding: "12px",
              backgroundColor: currentColors.warning,
              borderRadius: "8px",
              border: `1px solid ${currentColors.warningBorder}`,
            }}
          >
            <h4
              style={{
                fontSize: "14px",
                fontWeight: "600",
                color: currentColors.warningText,
                margin: "0 0 8px 0",
                textAlign: "center",
              }}
            >
              🤖 AI 추천번호 적용하기
            </h4>
            <p
              style={{
                fontSize: "11px",
                color: currentColors.warningText,
                margin: "0 0 12px 0",
                textAlign: "center",
                opacity: 0.8,
              }}
            >
              번호추천 메뉴에서 생성된 AI 분석 번호
            </p>

            <div
              style={{ display: "flex", flexDirection: "column", gap: "6px" }}
            >
              {aiRecommendedNumbers.map((rec, index) => (
                <button
                  key={index}
                  onClick={() => applyRecommendedNumbers(rec.numbers)}
                  style={{
                    width: "100%",
                    padding: "8px",
                    backgroundColor: currentColors.surface,
                    border: `1px solid ${currentColors.border}`,
                    borderRadius: "6px",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "4px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: "600",
                        color: currentColors.text,
                      }}
                    >
                      {rec.name}
                    </span>
                    <span
                      style={{
                        fontSize: "9px",
                        color: currentColors.textSecondary,
                      }}
                    >
                      적용하기 →
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: "2px",
                      justifyContent: "center",
                    }}
                  >
                    {rec.numbers.map((num, i) => (
                      <div
                        key={i}
                        style={{
                          width: "16px",
                          height: "16px",
                          borderRadius: "50%",
                          backgroundColor: "#d97706",
                          color: "white",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "8px",
                          fontWeight: "bold",
                        }}
                      >
                        {num}
                      </div>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 저장/취소 버튼 */}
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={() => {
                setShowAddForm(false);
                setSelectedNumbers([]);
                setIsAutoSelect(false);
              }}
              style={{
                flex: 1,
                backgroundColor: currentColors.textSecondary,
                color: "white",
                padding: "12px",
                borderRadius: "8px",
                border: "none",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              취소
            </button>
            <button
              onClick={saveNumbers}
              disabled={selectedNumbers.length !== 6}
              style={{
                flex: 2,
                backgroundColor:
                  selectedNumbers.length === 6
                    ? "#dc2626"
                    : currentColors.textSecondary,
                color: "white",
                padding: "12px",
                borderRadius: "8px",
                border: "none",
                fontSize: "14px",
                fontWeight: "600",
                cursor:
                  selectedNumbers.length === 6 ? "pointer" : "not-allowed",
                boxShadow:
                  selectedNumbers.length === 6
                    ? "0 4px 12px rgba(220, 38, 38, 0.4)"
                    : "none",
                transform:
                  selectedNumbers.length === 6 ? "translateY(-2px)" : "none",
                transition: "all 0.2s",
              }}
            >
              {selectedNumbers.length === 6
                ? "🎫 번호 저장하기"
                : `${6 - selectedNumbers.length}개 더 선택`}
            </button>
          </div>
        </div>
      )}

      {/* 번호 목록 */}
      {filteredHistory.length === 0 ? (
        <div
          style={{
            backgroundColor: currentColors.surface,
            padding: "32px 16px",
            borderRadius: "8px",
            border: `1px solid ${currentColors.border}`,
            textAlign: "center",
          }}
        >
          {filter === "checked" ? (
            (() => {
              const message = getCheckedFilterMessage();
              return (
                <>
                  <div style={{ fontSize: "48px", marginBottom: "12px" }}>
                    {message.icon}
                  </div>
                  <p
                    style={{
                      fontSize: "16px",
                      fontWeight: "bold",
                      color: currentColors.text,
                      margin: "0 0 6px 0",
                    }}
                  >
                    {message.title}
                  </p>
                  <p
                    style={{
                      color: currentColors.textSecondary,
                      margin: "0",
                      fontSize: "14px",
                    }}
                  >
                    {message.description}
                  </p>
                </>
              );
            })()
          ) : filter === "favorite" ? (
            <>
              <div style={{ fontSize: "48px", marginBottom: "12px" }}>⭐</div>
              <p
                style={{
                  fontSize: "16px",
                  fontWeight: "bold",
                  color: currentColors.text,
                  margin: "0 0 6px 0",
                }}
              >
                즐겨찾기한 번호가 없어요
              </p>
              <p
                style={{
                  color: currentColors.textSecondary,
                  margin: "0",
                  fontSize: "14px",
                }}
              >
                번호를 등록하고 ⭐ 버튼을 눌러 즐겨찾기하세요!
              </p>
            </>
          ) : filter === "saved" ? (
            <>
              <div style={{ fontSize: "48px", marginBottom: "12px" }}>💾</div>
              <p
                style={{
                  fontSize: "16px",
                  fontWeight: "bold",
                  color: currentColors.text,
                  margin: "0 0 6px 0",
                }}
              >
                저장된 번호가 없어요
              </p>
              <p
                style={{
                  color: currentColors.textSecondary,
                  margin: "0",
                  fontSize: "14px",
                }}
              >
                새 번호를 등록해보세요!
              </p>
            </>
          ) : (
            <>
              <div style={{ fontSize: "48px", marginBottom: "12px" }}>📋</div>
              <p
                style={{
                  fontSize: "16px",
                  fontWeight: "bold",
                  color: currentColors.text,
                  margin: "0 0 6px 0",
                }}
              >
                등록된 번호가 없어요
              </p>
              <p
                style={{
                  color: currentColors.textSecondary,
                  margin: "0",
                  fontSize: "14px",
                }}
              >
                번호를 등록해서 당첨을 확인해보세요!
              </p>
            </>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {filteredHistory.map((item) => {
            const result = item.checked
              ? checkWinning(item.numbers, item.date)
              : null;
            const isWinner = result && result.status === "winning";
            const isPending = result && result.status === "pending";

            return (
              <div
                key={item.id}
                style={{
                  backgroundColor: currentColors.surface,
                  borderRadius: "8px",
                  padding: "12px",
                  border: isWinner
                    ? `2px solid ${currentColors.accent}`
                    : isPending
                    ? `2px solid ${currentColors.pendingBorder}`
                    : `1px solid ${currentColors.border}`,
                  boxShadow: isWinner
                    ? `0 2px 8px ${currentColors.accent}30`
                    : isPending
                    ? `0 2px 8px ${currentColors.pendingBorder}30`
                    : "none",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "8px",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        marginBottom: "2px",
                      }}
                    >
                      <h3
                        style={{
                          fontWeight: "bold",
                          color: currentColors.text,
                          margin: "0",
                          fontSize: "14px",
                        }}
                      >
                        {item.strategy}
                      </h3>
                      {/* 상태 표시 아이콘 */}
                      {item.status === "favorite" && (
                        <span style={{ fontSize: "14px" }}>⭐</span>
                      )}
                      {item.status === "checked" && (
                        <span style={{ fontSize: "14px" }}>
                          {isPending ? "⏰" : "✅"}
                        </span>
                      )}
                    </div>
                    <p
                      style={{
                        fontSize: "12px",
                        color: currentColors.textSecondary,
                        margin: "0",
                      }}
                    >
                      {item.date} 등록
                      {/* 📅 추첨일 정보 표시 */}
                      {result && result.drawDate && (
                        <span style={{ marginLeft: "8px", fontSize: "11px" }}>
                          | 추첨:{" "}
                          {result.drawDate.split(" ").slice(0, 3).join(" ")}
                        </span>
                      )}
                    </p>
                  </div>

                  {/* 상태 변경 및 액션 버튼들 */}
                  <div
                    style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}
                  >
                    {/* 즐겨찾기 토글 */}
                    <button
                      onClick={() =>
                        changeItemStatus(
                          item.id,
                          item.status === "favorite" ? "saved" : "favorite"
                        )
                      }
                      style={{
                        padding: "4px 8px",
                        backgroundColor:
                          item.status === "favorite"
                            ? "#d97706"
                            : currentColors.gray,
                        color:
                          item.status === "favorite"
                            ? "white"
                            : currentColors.textSecondary,
                        borderRadius: "4px",
                        border: "none",
                        fontSize: "12px",
                        cursor: "pointer",
                      }}
                    >
                      {item.status === "favorite" ? "⭐" : "☆"}
                    </button>

                    {/* 복사 버튼 */}
                    <button
                      onClick={() => copyNumbers(item.numbers)}
                      style={{
                        padding: "4px 8px",
                        backgroundColor: "#8b5cf6",
                        color: "white",
                        borderRadius: "4px",
                        border: "none",
                        fontSize: "12px",
                        cursor: "pointer",
                      }}
                    >
                      복사
                    </button>

                    {/* 당첨확인 버튼 - 추첨 대기중이면 계속 활성화 */}
                    <button
                      onClick={() => {
                        onCheck(item.id, item.numbers);
                        changeItemStatus(item.id, "checked");
                      }}
                      disabled={item.checked && !isPending}
                      style={{
                        padding: "4px 8px",
                        backgroundColor:
                          item.checked && !isPending
                            ? currentColors.textSecondary
                            : currentColors.accent,
                        color: "white",
                        borderRadius: "4px",
                        border: "none",
                        fontSize: "12px",
                        cursor:
                          item.checked && !isPending
                            ? "not-allowed"
                            : "pointer",
                      }}
                    >
                      {item.checked && !isPending ? "확인완료" : "당첨확인"}
                    </button>

                    {/* 삭제 버튼 */}
                    <button
                      onClick={() => {
                        onDelete(item.id);
                        setLocalHistory((prev) =>
                          prev.filter(
                            (historyItem) => historyItem.id !== item.id
                          )
                        );
                      }}
                      style={{
                        padding: "4px 8px",
                        backgroundColor: "#dc2626",
                        color: "white",
                        borderRadius: "4px",
                        border: "none",
                        fontSize: "12px",
                        cursor: "pointer",
                      }}
                    >
                      삭제
                    </button>
                  </div>
                </div>

                {/* 번호 표시 */}
                <div
                  style={{
                    display: "flex",
                    gap: "4px",
                    justifyContent: "center",
                    backgroundColor: currentColors.gray,
                    padding: "8px",
                    borderRadius: "6px",
                    marginBottom: result ? "8px" : "0",
                  }}
                >
                  {item.numbers.map((num, i) => (
                    <LottoNumberBall
                      key={i}
                      number={num}
                      size="sm"
                      isMatched={
                        result && result.status !== "pending"
                          ? pastWinningNumbers[0].slice(0, 7).includes(num)
                          : false
                      }
                    />
                  ))}
                </div>

                {/* 🎯 개선된 당첨 결과 표시 */}
                {result && (
                  <div
                    style={{
                      padding: "8px",
                      backgroundColor: isPending
                        ? currentColors.pending
                        : isWinner
                        ? currentColors.success
                        : currentColors.error,
                      borderRadius: "6px",
                      border: isPending
                        ? `1px solid ${currentColors.pendingBorder}`
                        : isWinner
                        ? `1px solid ${currentColors.successBorder}`
                        : `1px solid ${currentColors.errorBorder}`,
                      textAlign: "center",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "14px",
                        fontWeight: "bold",
                        color: isPending
                          ? currentColors.pendingText
                          : isWinner
                          ? currentColors.successText
                          : currentColors.errorText,
                      }}
                    >
                      {isPending
                        ? "⏰ 추첨 대기중"
                        : result.grade === "낙첨"
                        ? "😔 낙첨"
                        : `🎉 ${result.grade} 당첨!`}
                    </span>
                    <p
                      style={{
                        fontSize: "12px",
                        color: isPending
                          ? currentColors.pendingText
                          : isWinner
                          ? currentColors.successText
                          : currentColors.errorText,
                        margin: "2px 0 0 0",
                      }}
                    >
                      {result.message}
                    </p>
                    {/* 📅 추첨일 정보 */}
                    {isPending && (
                      <p
                        style={{
                          fontSize: "11px",
                          color: currentColors.pendingText,
                          margin: "4px 0 0 0",
                          opacity: 0.8,
                        }}
                      >
                        {result.drawDate}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Purchase;
