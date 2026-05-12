-- ============================================================
-- 데모 콘텐츠 시드 — 상품 / 리뷰 / FAQ / 공지
-- ============================================================

-- ─── 추가 상품 (기존 11개 → 25+개) ─────────────
insert into public.products (id, name, description, price, original_price, stock, category, image, visibility, is_best, is_new) values
  ('p-012', '디지털 머신 — Compact', '소형 경량 바디. 출장·이동 시술에 최적화. USB-C 충전.', 580000, 720000, 12, '머신', 'https://images.unsplash.com/photo-1583912086296-be5b665036d3?w=900&q=80&auto=format&fit=crop', 'public', false, true),
  ('p-013', '엠보 펜 — Heritage', '수제 우드 그립. 가벼우면서 손에 안정적으로 감기는 클래식 라인.', 65000, null, 30, '엠보', 'https://placehold.co/900x900/F6EFE6/8C6633?font=playfair&text=Heritage+Pen', 'public', true, false),
  ('p-014', '엠보 블레이드 — 12U', '12핀 U타입. 섬세한 헤어 스트로크 표현에 적합.', 11000, null, 250, '엠보', 'https://placehold.co/900x900/F6EFE6/8C6633?font=playfair&text=12U+Blade', 'public', false, false),
  ('p-015', '엠보 블레이드 — 21U', '21핀 U타입. 풀 브로우 작업 시 효율적.', 13000, null, 180, '엠보', 'https://placehold.co/900x900/F6EFE6/8C6633?font=playfair&text=21U+Blade', 'public', false, false),
  ('p-016', '눈썹 색소 — Cool Brown', '쿨톤 베이스. 차분한 자연색 발색.', 55000, null, 50, '색소', 'https://placehold.co/900x900/FBF7F0/A55C5C?font=playfair&text=Cool+Brown', 'public', false, false),
  ('p-017', '눈썹 색소 — Soft Black', '농도 조절이 쉬운 블랙 베이스. 진한 시술용.', 58000, null, 45, '색소', 'https://placehold.co/900x900/FBF7F0/2F2F2F?font=playfair&text=Soft+Black', 'public', false, true),
  ('p-018', '입술 색소 — Rose Pink', '봄날의 핑크 베이스. 자연스러운 입술 톤업.', 62000, null, 30, '색소', 'https://placehold.co/900x900/FBF7F0/D78EA0?font=playfair&text=Rose+Pink', 'public', true, false),
  ('p-019', '입술 색소 — Berry', '깊이 있는 베리톤. 가을·겨울 시술 인기.', 64000, null, 25, '색소', 'https://placehold.co/900x900/FBF7F0/8E3B5A?font=playfair&text=Berry', 'public', false, false),
  ('p-020', '아이라인 색소 — Jet Black', '아이라인 전용 진한 블랙. 발색 지속력 우수.', 48000, null, 40, '색소', 'https://placehold.co/900x900/FBF7F0/0F0F0F?font=playfair&text=Jet+Black', 'student', false, false),
  ('p-021', '디스포저블 니들 — 3RL', '라운드 라이너 3핀. 50개입 박스.', 26000, null, 90, '위생', 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=900&q=80&auto=format&fit=crop', 'public', false, false),
  ('p-022', '디스포저블 니들 — 5RL', '라운드 라이너 5핀. 두꺼운 라인용. 50개입.', 28000, null, 80, '위생', 'https://images.unsplash.com/photo-1583912086296-be5b665036d3?w=900&q=80&auto=format&fit=crop', 'public', false, false),
  ('p-023', '니트릴 글러브 (100매)', '시술용 무파우더 글러브. 알러지 안전.', 18000, null, 200, '위생', 'https://images.unsplash.com/photo-1583912086296-be5b665036d3?w=900&q=80&auto=format&fit=crop', 'public', false, false),
  ('p-024', '시술용 마스크 (50매)', '의료급 KF-AD 마스크.', 12000, null, 350, '위생', 'https://placehold.co/900x900/F6EFE6/7A6A55?font=playfair&text=Mask', 'public', false, false),
  ('p-025', '소독 알콜 스왑 (200매)', '개별 포장 알콜 스왑.', 9000, null, 400, '위생', 'https://placehold.co/900x900/F6EFE6/7A6A55?font=playfair&text=Swab', 'public', false, false),
  ('p-026', '쿨링 마스크 — 시술 직후', '시술 직후 부기·열감 진정용. 1회용 5장 세트.', 35000, 45000, 60, '케어', 'https://placehold.co/900x900/F6EFE6/B5894A?font=playfair&text=Cool+Mask', 'public', true, true),
  ('p-027', '아이브로우 컨디셔너', '시술 후 회복기 매일 사용. 30ml.', 28000, null, 50, '케어', 'https://placehold.co/900x900/FBF7F0/B5894A?font=playfair&text=Brow+Cond', 'public', false, false),
  ('p-028', '립 리커버 밤', '입술 시술 후 회복 전용 밤. 10ml.', 22000, null, 65, '케어', 'https://placehold.co/900x900/FBF7F0/A55C5C?font=playfair&text=Lip+Recover', 'public', false, true),
  ('p-029', 'SPF50+ 시술 부위 선크림', '시술 부위 보호용 무자극 선크림. 50ml.', 32000, null, 70, '케어', 'https://placehold.co/900x900/FBF7F0/B5894A?font=playfair&text=Sun+Care', 'public', false, false),
  ('p-030', '프로용 시술 침대 (수강생)', '높이 조절 가능한 시술용 침대. 수강생 특별가.', 850000, 1100000, 8, '머신', 'https://placehold.co/900x900/F6EFE6/8C6633?font=playfair&text=Studio+Bed', 'student', false, false)
on conflict (id) do nothing;


-- ─── 샘플 리뷰 ─────────────────────────────────
-- 데모 유저 ID 사용 (위에서 생성된 5명)
insert into public.reviews (user_id, user_name, product_id, rating, content) values
  ('5dace6c2-a6fa-45d7-8dd8-b4fbb748f97d', '김지수', 'p-001', 5, '정밀하고 안정적이에요. 손목 부담이 확실히 줄었습니다. 시그니처 라인은 역시 다르네요!'),
  ('7543b93e-6bcb-49e2-8983-c587a53cc43e', '박민호', 'p-001', 5, '저소음에 진동도 일정해서 만족합니다. 1년째 메인 머신으로 쓰는 중.'),
  ('5a524e0a-9a6e-4f5e-8950-6cbee9586cbd', '이수정', 'p-001', 4, '가격대비 만족스러워요. 다만 케이스가 별도 판매라 아쉬움.'),
  ('fda203ef-e596-43b7-9983-2d19a7d67991', '최예나', 'p-002', 5, '디테일 작업이 훨씬 수월해졌어요. 무게 밸런스가 정말 좋네요.'),
  ('9b899374-4f36-4b44-b092-872da8d462d2', '정대현', 'p-002', 4, '로터리 모터 소음이 거의 없어서 고객 만족도 ↑'),
  ('5dace6c2-a6fa-45d7-8dd8-b4fbb748f97d', '김지수', 'p-003', 5, '클래식 펜 중에 최고! 그립감이 손에 착 감기네요.'),
  ('7543b93e-6bcb-49e2-8983-c587a53cc43e', '박민호', 'p-005', 5, 'Warm Brown 발색이 자연스럽고 유지력이 길어요. 고객들 만족도가 정말 높습니다.'),
  ('5a524e0a-9a6e-4f5e-8950-6cbee9586cbd', '이수정', 'p-005', 4, '실수 없는 안정적인 발색. 매번 같은 색감이 나와요.'),
  ('fda203ef-e596-43b7-9983-2d19a7d67991', '최예나', 'p-009', 5, '시술 직후 안정감이 다릅니다. 진정도 빨라요.'),
  ('9b899374-4f36-4b44-b092-872da8d462d2', '정대현', 'p-009', 5, '향도 자극 없고 발림성 좋아요. 고객 키트에 항상 포함하는 제품.'),
  ('5dace6c2-a6fa-45d7-8dd8-b4fbb748f97d', '김지수', 'p-018', 5, '봄철 시술에 정말 잘 어울리는 핑크 톤. 추천!'),
  ('7543b93e-6bcb-49e2-8983-c587a53cc43e', '박민호', 'p-026', 5, '쿨링 마스크는 신의 한수. 시술 직후 부기가 확연히 줄어요.'),
  ('5a524e0a-9a6e-4f5e-8950-6cbee9586cbd', '이수정', 'p-026', 4, '효과는 좋은데 가격이 살짝 부담. 그래도 효과 봐서 재구매 예정.'),
  ('fda203ef-e596-43b7-9983-2d19a7d67991', '최예나', 'p-013', 5, 'Heritage 펜은 정말 예술품 같아요. 디자인도 만족.'),
  ('9b899374-4f36-4b44-b092-872da8d462d2', '정대현', 'p-016', 5, 'Cool Brown 발색 너무 좋아요. 차분하면서 자연스러움.');


-- ─── FAQ ──────────────────────────────────────
insert into public.faqs (question, answer, category, sort_order) values
  ('회원가입 시 어떤 정보가 필요한가요?', '이메일과 비밀번호, 이름만 입력하시면 됩니다. 카카오 로그인도 곧 지원될 예정이에요.', 'general', 10),
  ('수강생 코드는 어디서 받나요?', '오프라인 강의를 등록하신 분들께 안내된 액세스 코드가 발급됩니다. 코드 입력 후 "수강생 인증"을 완료하시면 수강생 전용 상품을 보실 수 있어요.', 'general', 20),
  ('주문 후 배송까지 얼마나 걸리나요?', '평균 1~3 영업일 이내 출고됩니다. 도서산간 지역은 추가 1~2일 소요될 수 있습니다.', 'shipping', 10),
  ('배송 추적은 어떻게 하나요?', '/account 페이지의 주문 내역에서 각 주문의 상세 페이지로 들어가시면 운송장 정보를 확인하실 수 있습니다.', 'shipping', 20),
  ('결제 수단은 어떤 게 있나요?', '카카오페이, 신용카드, 계좌이체 등 토스페이먼츠가 지원하는 모든 수단을 사용하실 수 있습니다.', 'payment', 10),
  ('영수증을 받을 수 있나요?', '결제 완료 후 주문 상세 페이지에서 "영수증 보기" 버튼으로 토스페이먼츠 영수증을 확인하실 수 있습니다.', 'payment', 20),
  ('환불 신청은 어떻게 하나요?', '상품 수령일로부터 7일 이내 단순 변심 환불이 가능합니다. 위생용품(니들·블레이드 등) 개봉 후는 환불이 어려운 점 양해 부탁드립니다.', 'order', 10),
  ('주문 후 취소가 가능한가요?', '배송 준비 단계 이전이라면 고객센터를 통해 즉시 취소 가능합니다. 출고 후엔 반품 절차를 통해 환불됩니다.', 'order', 20),
  ('상품에 하자가 있어요. 교환되나요?', '수령 후 30일 이내 사진과 함께 고객센터로 문의해 주시면 무료 교환 또는 환불 처리됩니다.', 'order', 30),
  ('수강생 전용 상품은 누구나 살 수 있나요?', '아니오, 수강생 코드로 승급된 회원만 구매할 수 있습니다. 관리자 권한이 있으면 모든 상품에 접근 가능합니다.', 'product', 10);


-- ─── 공지사항 ─────────────────────────────────
insert into public.notices (title, content, type, pinned, ends_at) values
  ('🎉 The Nature Academy 정식 오픈', E'안녕하세요, 반영구 시술 전문가 여러분.\n\nThe Nature Academy 온라인 쇼핑몰이 정식 오픈했습니다. 머신·엠보·색소·위생·케어 전 카테고리 엄선된 제품을 한 곳에서 만나보세요.', 'event', true, null),
  ('가입 첫 주문 10% 할인', E'신규 회원 가입 후 첫 주문에 사용 가능한 10% 할인 쿠폰을 발급해드립니다.\n\n쿠폰 코드: WELCOME10\n사용 조건: 최소 주문 금액 없음, 가입 후 30일 이내', 'event', false, null),
  ('일부 색소 라인 신규 입고', '쿨톤·핑크·베리 등 신규 색소 라인이 입고되었습니다. 한정 수량으로 준비되었으니 서둘러 만나보세요.', 'info', false, null);


-- ─── 환영 쿠폰 ────────────────────────────────
insert into public.coupons (code, label, type, value, min_order_amount, max_uses, active) values
  ('WELCOME10', '신규가입 환영 10%', 'percent', 10, 0, null, true),
  ('SPRING2026', '봄맞이 5천원 할인', 'fixed', 5000, 30000, 100, true)
on conflict (code) do nothing;
