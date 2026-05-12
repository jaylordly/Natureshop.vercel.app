'use client';
import { useEffect, useState } from 'react';
import { Eye, EyeOff, RotateCcw } from 'lucide-react';
import * as creds from '@/lib/credentials';

export const dynamic = 'force-dynamic';

export default function SettingsPage() {
  return (
    <div className="container-narrow py-10 space-y-8">
      <header>
        <h1 className="font-serif text-3xl mb-2">설정</h1>
        <p className="text-ink/60 text-sm">관리자 계정과 수강생 액세스 코드를 관리합니다.</p>
      </header>
      <AccountSettings />
      <StudentCodeManager />
    </div>
  );
}

type Msg = { type: 'success' | 'error'; text: string } | null;

function AccountSettings() {
  const [currentId, setCurrentId] = useState('');
  const [currentPw, setCurrentPw] = useState('');
  const [newId, setNewId] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [msg, setMsg] = useState<Msg>(null);
  const [savedId, setSavedId] = useState('');

  useEffect(() => {
    setSavedId(creds.getAdminCreds().id);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    if (!creds.verifyAdmin(currentId, currentPw)) {
      setMsg({ type: 'error', text: '현재 ID 또는 비밀번호가 일치하지 않습니다.' });
      return;
    }
    if (!newId.trim() || !newPw) {
      setMsg({ type: 'error', text: '새 ID와 비밀번호를 모두 입력해 주세요.' });
      return;
    }
    if (newPw.length < 4) {
      setMsg({ type: 'error', text: '비밀번호는 4자 이상이어야 합니다.' });
      return;
    }
    if (newPw !== confirmPw) {
      setMsg({ type: 'error', text: '새 비밀번호가 일치하지 않습니다.' });
      return;
    }
    creds.setAdminCreds({ id: newId.trim(), password: newPw });
    setSavedId(newId.trim());
    setCurrentId('');
    setCurrentPw('');
    setNewId('');
    setNewPw('');
    setConfirmPw('');
    setMsg({ type: 'success', text: '관리자 계정 정보가 변경되었습니다. 다음 로그인부터 새 정보가 적용됩니다.' });
  };

  const handleReset = () => {
    if (!confirm('기본값(admin / admin123)으로 되돌리시겠어요?')) return;
    creds.setAdminCreds(creds.DEFAULT_ADMIN);
    setSavedId(creds.DEFAULT_ADMIN.id);
    setMsg({ type: 'success', text: '기본값으로 되돌렸습니다.' });
  };

  return (
    <section className="bg-card border border-gold/30 p-6 sm:p-8">
      <h2 className="font-serif text-2xl mb-2">관리자 계정</h2>
      <p className="text-sm text-ink/60 mb-6">
        현재 아이디: <span className="font-mono font-medium">{savedId}</span>
      </p>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        <Field label="현재 ID" value={currentId} onChange={setCurrentId} autoComplete="username" />
        <Field
          label="현재 비밀번호"
          type={showPw ? 'text' : 'password'}
          value={currentPw}
          onChange={setCurrentPw}
          autoComplete="current-password"
          rightSlot={
            <button
              type="button"
              onClick={() => setShowPw((s) => !s)}
              className="px-3 text-ink/40 hover:text-ink"
              aria-label={showPw ? '비밀번호 숨기기' : '비밀번호 보기'}
            >
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          }
        />
        <hr className="border-gold/30 my-2" />
        <Field label="새 ID" value={newId} onChange={setNewId} autoComplete="off" />
        <Field
          label="새 비밀번호 (4자 이상)"
          type={showPw ? 'text' : 'password'}
          value={newPw}
          onChange={setNewPw}
          autoComplete="new-password"
        />
        <Field
          label="새 비밀번호 확인"
          type={showPw ? 'text' : 'password'}
          value={confirmPw}
          onChange={setConfirmPw}
          autoComplete="new-password"
        />
        {msg && <Message msg={msg} />}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="bg-ink text-beige px-6 py-3 text-sm tracking-shop hover:bg-gold hover:text-ink transition"
          >
            변경 저장
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="border border-gold/40 px-4 py-3 text-sm tracking-shop text-ink/60 hover:bg-ink/5 transition flex items-center gap-2"
          >
            <RotateCcw className="w-3.5 h-3.5" /> 기본값으로
          </button>
        </div>
      </form>
    </section>
  );
}

function StudentCodeManager() {
  const [code, setCode] = useState('');
  const [original, setOriginal] = useState('');
  const [msg, setMsg] = useState<Msg>(null);

  useEffect(() => {
    const c = creds.getStudentCode();
    setCode(c);
    setOriginal(c);
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) {
      setMsg({ type: 'error', text: '코드를 입력해 주세요.' });
      return;
    }
    if (trimmed.length < 4) {
      setMsg({ type: 'error', text: '코드는 4자 이상이어야 합니다.' });
      return;
    }
    creds.setStudentCode(trimmed);
    setOriginal(trimmed);
    setCode(trimmed);
    setMsg({ type: 'success', text: `수강생 코드를 "${trimmed}"로 변경했습니다. 학생들에게 새 코드를 공유해 주세요.` });
  };

  const handleReset = () => {
    if (!confirm('기본 코드(STUDENT2026)로 되돌리시겠어요?')) return;
    creds.setStudentCode(creds.DEFAULT_STUDENT_CODE);
    setCode(creds.DEFAULT_STUDENT_CODE);
    setOriginal(creds.DEFAULT_STUDENT_CODE);
    setMsg({ type: 'success', text: '기본 코드로 되돌렸습니다.' });
  };

  return (
    <section className="bg-card border border-gold/30 p-6 sm:p-8">
      <h2 className="font-serif text-2xl mb-2">수강생 액세스 코드</h2>
      <p className="text-sm text-ink/60 mb-6">
        수강생이 로그인 페이지에서 입력하는 코드입니다. 변경 후 학생들에게 새 코드를 공유해 주세요.
      </p>
      <form onSubmit={handleSave} className="space-y-4 max-w-md">
        <Field
          label="수강생 코드"
          value={code}
          onChange={(v) => setCode(v.toUpperCase())}
          autoComplete="off"
          mono
        />
        {msg && <Message msg={msg} />}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={code === original}
            className="bg-ink text-beige px-6 py-3 text-sm tracking-shop hover:bg-gold hover:text-ink transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            저장
          </button>
          <button
            type="button"
            onClick={() => setCode(original)}
            disabled={code === original}
            className="border border-gold/40 px-4 py-3 text-sm tracking-shop text-ink/60 hover:bg-ink/5 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            되돌리기
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="border border-gold/40 px-4 py-3 text-sm tracking-shop text-ink/60 hover:bg-ink/5 transition flex items-center gap-2 ml-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" /> 기본값으로
          </button>
        </div>
      </form>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  autoComplete,
  rightSlot,
  mono,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  autoComplete?: string;
  rightSlot?: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs tracking-shop uppercase text-ink/60 mb-1.5">{label}</label>
      <div className="flex border border-gold/40 focus-within:border-gold bg-card">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          spellCheck={false}
          className={`flex-1 px-4 py-3 text-sm focus:outline-none bg-transparent ${mono ? 'font-mono tracking-shop' : ''}`}
        />
        {rightSlot}
      </div>
    </div>
  );
}

function Message({ msg }: { msg: NonNullable<Msg> }) {
  return (
    <p className={`text-sm ${msg.type === 'error' ? 'text-red-600' : 'text-green-700'}`}>
      {msg.text}
    </p>
  );
}
