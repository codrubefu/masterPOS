import { Navigate, Route, Routes } from "react-router-dom";
import { PosPage } from "../pages/PosPage";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<PosPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
