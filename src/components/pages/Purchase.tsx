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
  theme: "light" | "dark";
}

const Purchase: React.FC<PurchaseProps> = ({
  purchaseHistory,
  onDelete,
  onCheck,
  onAdd,
  pastWinningNumbers,
  theme,
}) => {
  const [localPurchaseHistory, setLocalPurchaseHistory] = useState<PurchaseItem[]>([]);
  const [inputNumbers, setInputNumbers] = useState<string>("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [sortBy, setSortBy] = useState<"date" | "status">("date");
  const [filterStatus, setFilterStatus] = useState<"all" | "saved" | "favorite" | "checked">("all");

  const colors = {
    light: {
      background: "#f9fafb",
      surface: "#ffffff",
      primary: "#2563eb",
      text: "#1f2937",
      textSecondary: "#6b7280",
      border: "#e5e7eb",
      accent: "#059669",
      error: "#dc2626",
      warning: "#f59e0b",
    },
    dark: {
      background: "#0f172a",
      surface: "#1e293b",
      primary: "#3b82f6",
      text: "#f1f5f9",
      textSecondary: "#94a3b8",
      border: "#334155",
      accent: "#10b981",
      error: "#ef4444",
      warning: "#f97316",
    },
  };

  const currentColors = colors[theme];

  // localStorage에서 데이터 불러오기
  useEffect(() => {
    const savedData = localStorage.getItem('lotto_purchase_history');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        setLocalPurchaseHistory(parsedData);
        console.log('데이터 로드 완료:', parsedData.length, '개 항목');
      } catch (error) {
        console.error('데이터 로드 실패:', error);
        setLocalPurchaseHistory([]);
      }
    }
  }, []);

  // 데이터 변경 시 localStorage에 저장
  useEffect(() => {
    if (localPurchaseHistory.length > 0) {
      localStorage.setItem('lotto_purchase_history', JSON.stringify(localPurchaseHistory));
      console.log('데이터 저장 완료:', localPurchaseHistory.length, '개 항목');
    }
  }, [localPurchaseHistory]);

  const combinedHistory = [...purchaseHistory, ...localPurchaseHistory];

  const filteredHistory = combinedHistory
    .filter((item) => filterStatus === "all" || item.status === filterStatus)
    .sort((a, b) => {
      if (sortBy === "date") {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
      return a.status.localeCompare(b.status);
    });

  const handleAddNumbers = () => {
    const nums = inputNumbers
      .split(/[\s,]+/)
      .map((n) => parseInt(n.trim()))
      .filter((n) => !isNaN(n) && n >= 1 && n <= 45);

    if (nums.length === 6 && new Set(nums).size === 6) {
      const newItem: PurchaseItem = {
        id: Date.now(),
        numbers: nums.sort((a, b) => a - b),
        strategy: "수동입력",
        date: new Date().toISOString(),
        checked: false,
        status: "saved",
      };
      
      setLocalPurchaseHistory([...localPurchaseHistory, newItem]);
      setInputNumbers("");
      setShowAddForm(false);
    } else {
      alert("1~45 사이의 서로 다른 숫자 6개를 입력해주세요.");
    }
  };

  const handleDeleteLocal = (id: number) => {
    setLocalPurchaseHistory(localPurchaseHistory.filter(item => item.id !== id));
  };

  const handleDelete = (id: number) => {
    if (localPurchaseHistory.some(item => item.id === id)) {
      handleDeleteLocal(id);
    } else {
      onDelete(id);
    }
  };

  const toggleStatus = (id: number) => {
    const updatedHistory = localPurchaseHistory.map((item) => {
      if (item.id === id) {
        const statusOrder: ("saved" | "favorite" | "checked")[] = ["saved", "favorite", "checked"];
        const currentIndex = statusOrder.indexOf(item.status);
        const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length];
        return { ...item, status: nextStatus };
      }
      return item;
    });
    setLocalPurchaseHistory(updatedHistory);
  };

  const checkWinning = (numbers: number[], winningNumbers: number[]) => {
    const mainNumbers = winningNumbers.slice(0, 6);
    const bonusNumber = winningNumbers[6];
    const matchCount = numbers.filter((n) => mainNumbers.includes(n)).length;
    const hasBonus = numbers.includes(bonusNumber);

    if (matchCount === 6) return { grade: "1등", message: "🎉 축하합니다!", color: "#ffd700" };
    if (matchCount === 5 && hasBonus) return { grade: "2등", message: "대박!", color: "#c0c0c0" };
    if (matchCount === 5) return { grade: "3등", message: "훌륭해요!", color: "#cd7f32" };
    if (matchCount === 4) return { grade: "4등", message: "좋아요!", color: "#10b981" };
    if (matchCount === 3) return { grade: "5등", message: "당첨!", color: "#3b82f6" };
    return { grade: "낙첨", message: `${matchCount}개 일치`, color: currentColors.textSecondary };
  };

  const getStatusIcon = (status: "saved" | "favorite" | "checked") => {
    switch (status) {
      case "favorite":
        return "⭐";
      case "checked":
        return "✓";
      default:
        return "📌";
    }
  };

  const getStatusColor = (status: "saved" | "favorite" | "checked") => {
    switch (status) {
      case "favorite":
        return "#f59e0b";
      case "checked":
        return "#10b981";
      default:
        return currentColors.primary;
    }
  };

  return (
    <div
      style={{
        padding: "20px",
        backgroundColor: currentColors.background,
        minHeight: "100vh",
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <h2
        style={{
          fontSize: "24px",
          fontWeight: "bold",
          color: currentColors.text,
          marginBottom: "20px",
        }}
      >
        🛍️ 내번호함
      </h2>

      {/* 통계 카드 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "12px",
          marginBottom: "20px",
        }}
      >
        <div
          style={{
            backgroundColor: currentColors.surface,
            padding: "12px",
            borderRadius: "8px",
            textAlign: "center",
            border: `1px solid ${currentColors.border}`,
          }}
        >
          <div style={{ fontSize: "12px", color: currentColors.textSecondary }}>전체</div>
          <div style={{ fontSize: "20px", fontWeight: "bold", color: currentColors.primary }}>
            {combinedHistory.length}
          </div>
        </div>
        <div
          style={{
            backgroundColor: currentColors.surface,
            padding: "12px",
            borderRadius: "8px",
            textAlign: "center",
            border: `1px solid ${currentColors.border}`,
          }}
        >
          <div style={{ fontSize: "12px", color: currentColors.textSecondary }}>즐겨찾기</div>
          <div style={{ fontSize: "20px", fontWeight: "bold", color: "#f59e0b" }}>
            {combinedHistory.filter((item) => item.status === "favorite").length}
          </div>
        </div>
        <div
          style={{
            backgroundColor: currentColors.surface,
            padding: "12px",
            borderRadius: "8px",
            textAlign: "center",
            border: `1px solid ${currentColors.border}`,
          }}
        >
          <div style={{ fontSize: "12px", color: currentColors.textSecondary }}>구매완료</div>
          <div style={{ fontSize: "20px", fontWeight: "bold", color: "#10b981" }}>
            {combinedHistory.filter((item) => item.status === "checked").length}
          </div>
        </div>
      </div>

      {/* 번호 추가 버튼 */}
      <button
        onClick={() => setShowAddForm(!showAddForm)}
        style={{
          width: "100%",
          padding: "12px",
          backgroundColor: currentColors.primary,
          color: "white",
          border: "none",
          borderRadius: "8px",
          fontSize: "14px",
          fontWeight: "bold",
          cursor: "pointer",
          marginBottom: "12px",
        }}
      >
        ➕ 번호 직접 입력
      </button>

      {/* 번호 추가 폼 */}
      {showAddForm && (
        <div
          style={{
            backgroundColor: currentColors.surface,
            padding: "16px",
            borderRadius: "8px",
            marginBottom: "12px",
            border: `1px solid ${currentColors.border}`,
          }}
        >
          <input
            type="text"
            value={inputNumbers}
            onChange={(e) => setInputNumbers(e.target.value)}
            placeholder="번호 6개 입력 (예: 1 7 15 23 38 45)"
            style={{
              width: "100%",
              padding: "10px",
              backgroundColor: currentColors.background,
              color: currentColors.text,
              border: `1px solid ${currentColors.border}`,
              borderRadius: "6px",
              fontSize: "14px",
              marginBottom: "10px",
            }}
          />
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={handleAddNumbers}
              style={{
                flex: 1,
                padding: "8px",
                backgroundColor: currentColors.accent,
                color: "white",
                border: "none",
                borderRadius: "6px",
                fontSize: "14px",
                cursor: "pointer",
              }}
            >
              저장
            </button>
            <button
              onClick={() => {
                setShowAddForm(false);
                setInputNumbers("");
              }}
              style={{
                flex: 1,
                padding: "8px",
                backgroundColor: currentColors.textSecondary,
                color: "white",
                border: "none",
                borderRadius: "6px",
                fontSize: "14px",
                cursor: "pointer",
              }}
            >
              취소
            </button>
          </div>
        </div>
      )}

      {/* 필터 및 정렬 */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          marginBottom: "16px",
        }}
      >
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as any)}
          style={{
            flex: 1,
            padding: "8px",
            backgroundColor: currentColors.surface,
            color: currentColors.text,
            border: `1px solid ${currentColors.border}`,
            borderRadius: "6px",
            fontSize: "14px",
          }}
        >
          <option value="all">전체보기</option>
          <option value="saved">저장됨</option>
          <option value="favorite">즐겨찾기</option>
          <option value="checked">구매완료</option>
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as "date" | "status")}
          style={{
            flex: 1,
            padding: "8px",
            backgroundColor: currentColors.surface,
            color: currentColors.text,
            border: `1px solid ${currentColors.border}`,
            borderRadius: "6px",
            fontSize: "14px",
          }}
        >
          <option value="date">날짜순</option>
          <option value="status">상태순</option>
        </select>
      </div>

      {/* 저장된 번호 목록 */}
      {filteredHistory.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            color: currentColors.textSecondary,
            padding: "40px",
            backgroundColor: currentColors.surface,
            borderRadius: "8px",
          }}
        >
          저장된 번호가 없습니다
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {filteredHistory.map((item, index) => {
            const latestResult = pastWinningNumbers[0]
              ? checkWinning(item.numbers, pastWinningNumbers[0])
              : null;
            const isPending = !item.purchaseDate || new Date(item.purchaseDate) > new Date();
            const drawDate = item.purchaseDate
              ? new Date(item.purchaseDate).toLocaleDateString()
              : "추첨 예정";
            const isWinner = latestResult && latestResult.grade !== "낙첨";

            return (
              <div
                key={item.id}
                style={{
                  backgroundColor: currentColors.surface,
                  padding: "16px",
                  borderRadius: "8px",
                  border: `1px solid ${currentColors.border}`,
                  position: "relative",
                }}
              >
                {/* 상태 아이콘 및 삭제 버튼 */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "12px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <button
                      onClick={() => toggleStatus(item.id)}
                      style={{
                        padding: "4px 8px",
                        backgroundColor: getStatusColor(item.status),
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        fontSize: "12px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      {getStatusIcon(item.status)} {item.status === "saved" ? "저장됨" : item.status === "favorite" ? "즐겨찾기" : "구매완료"}
                    </button>
                    <span style={{ fontSize: "12px", color: currentColors.textSecondary }}>
                      {item.strategy}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDelete(item.id)}
                    style={{
                      padding: "4px 8px",
                      backgroundColor: currentColors.error,
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      fontSize: "12px",
                      cursor: "pointer",
                    }}
                  >
                    삭제
                  </button>
                </div>

                {/* 번호 표시 */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    gap: "8px",
                    marginBottom: "8px",
                  }}
                >
                  {item.numbers.map((num) => (
                    <LottoNumberBall key={num} number={num} />
                  ))}
                </div>

                {/* 날짜 및 결과 */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: "12px",
                    color: currentColors.textSecondary,
                  }}
                >
                  <span>{new Date(item.date).toLocaleDateString()}</span>
                  {item.memo && (
                    <span style={{ fontStyle: "italic" }}>{item.memo}</span>
                  )}
                </div>

                {/* 최신 회차 결과 표시 */}
                {latestResult && (
                  <div
                    style={{
                      marginTop: "8px",
                      padding: "8px",
                      backgroundColor: isPending
                        ? currentColors.background
                        : isWinner
                        ? `${latestResult.color}20`
                        : currentColors.background,
                      borderRadius: "4px",
                      border: isPending
                        ? `1px solid ${currentColors.border}`
                        : isWinner
                        ? `1px solid ${currentColors.accent}`
                        : `1px solid ${currentColors.border}`,
                      textAlign: "center",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "14px",
                        fontWeight: "bold",
                        color: isPending
                          ? currentColors.textSecondary
                          : isWinner
                          ? currentColors.accent
                          : currentColors.textSecondary,
                      }}
                    >
                      {isPending ? "⏰ 추첨 대기중" : latestResult.grade === "낙첨" ? "😔 낙첨" : `🎉 ${latestResult.grade} 당첨!`}
                    </span>
                    <p
                      style={{
                        fontSize: "12px",
                        color: isPending ? currentColors.textSecondary : isWinner ? currentColors.accent : currentColors.textSecondary,
                        margin: "2px 0 0 0",
                      }}
                    >
                      {latestResult.message}
                    </p>
                    {isPending && (
                      <p style={{ fontSize: "11px", color: currentColors.textSecondary, margin: "4px 0 0 0", opacity: 0.8 }}>
                        {drawDate}
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
