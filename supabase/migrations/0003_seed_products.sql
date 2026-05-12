-- ============================================================
-- 상품 시드 데이터 (lib/products.ts에서 이전)
-- ============================================================

insert into public.products (id, name, description, price, stock, category, image, visibility, is_best, is_new) values
  ('p-001', '디지털 머신 — Signature', '정밀한 진동수와 안정적인 토크. 장시간 시술에도 손목 부담을 최소화한 시그니처 디지털 머신.', 850000, 8, '머신', 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=900&q=80&auto=format&fit=crop', 'public', true, false),
  ('p-002', '로터리 머신 — Pro', '저소음 로터리 모터. 디테일 작업에 최적화된 무게 밸런스.', 720000, 5, '머신', 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=900&q=80&auto=format&fit=crop', 'public', false, true),
  ('p-003', '엠보 펜 — Classic', '경량 알루미늄 바디. 손에 자연스럽게 감기는 그립.', 38000, 40, '엠보', 'https://placehold.co/900x900/F6EFE6/B5894A?font=playfair&text=Embo+Pen', 'public', true, false),
  ('p-004', '엠보 블레이드 — 18U', '18핀 U타입 블레이드. 자연스러운 결을 표현하기 좋은 모델.', 12000, 200, '엠보', 'https://placehold.co/900x900/F6EFE6/8C6633?font=playfair&text=18U+Blade', 'public', false, false),
  ('p-005', '눈썹 색소 — Warm Brown', '웜톤 베이스. 시술 후 자연스러운 발색이 오래 유지됩니다.', 55000, 60, '색소', 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=900&q=80&auto=format&fit=crop', 'public', false, true),
  ('p-006', '입술 색소 — Coral', '쿨톤·웜톤 모두 어울리는 코랄 베이스 입술 전용 색소.', 58000, 35, '색소', 'https://placehold.co/900x900/FBF7F0/A55C5C?font=playfair&text=Lip+Coral', 'student', false, false),
  ('p-007', '디스포저블 니들 — 1RL', '개별 멸균 포장. 라운드 라이너 1RL, 한 박스 50개입.', 28000, 120, '위생', 'https://images.unsplash.com/photo-1583912086296-be5b665036d3?w=900&q=80&auto=format&fit=crop', 'public', false, false),
  ('p-008', '멸균 트레이 세트', '시술 전 위생 세팅을 위한 일회용 트레이 세트.', 9500, 300, '위생', 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=900&q=80&auto=format&fit=crop', 'public', false, false),
  ('p-009', '애프터 케어 밤', '시술 직후 진정과 보호. 자극이 적은 성분으로 구성.', 22000, 80, '케어', 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=900&q=80&auto=format&fit=crop', 'public', true, false),
  ('p-010', '리페어 세럼 — 14일 케어', '시술 부위 회복을 돕는 14일 케어 세럼. 수강생 전용 추천 제품.', 48000, 25, '케어', 'https://placehold.co/900x900/FBF7F0/B5894A?font=playfair&text=Repair+Serum', 'student', false, true),
  ('p-011', '프로용 마스터 키트 (관리자 전용)', '내부 운영용 마스터 키트입니다.', 1200000, 3, '머신', 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=900&q=80&auto=format&fit=crop', 'admin', false, false)
on conflict (id) do nothing;
