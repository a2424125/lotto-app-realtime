
import React from "react";
import NumberBall from "../common/NumberBall";
import { NextDrawInfo } from "../../types/lotto";

interface DashboardProps {
  latestResult: {
    round: number;
    date: string;
    numbers: number[];
    bonus: number;
  } | null;
  onMenuChange: (menu: string) => void;
  generate1stGradeNumbers: () => number[];
  onRefreshData: () => Promise<void>;
  nextDrawInfo: NextDrawInfo | null;
  isOffline: boolean;
  lastUpdated: string;
}

const Dashboard: React.FC<DashboardProps> = ({
  latestResult,
  onMenuChange,
  generate1stGradeNumbers,
  onRefreshData,
  nextDrawInfo,
  isOffline,
  lastUpdated
}) => {
  const winningNumbers = latestResult?.numbers || [];
  const bonusNumber = latestResult?.bonus ?? null;

  return (
    <div>
      <h2>{latestResult?.round}회 당첨결과</h2>
      <p>({latestResult?.date} 추첨)</p>
      <div>
        {winningNumbers.map((num, idx) => (
          <NumberBall key={idx} number={num} />
        ))}
        {bonusNumber && (
          <>
            <span> + </span>
            <NumberBall number={bonusNumber} />
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
