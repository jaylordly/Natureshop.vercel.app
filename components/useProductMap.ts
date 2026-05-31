'use client';
import { useEffect, useState } from 'react';
import { getAllProductsFromDb } from '@/lib/products';
import type { Product } from '@/lib/types';

/**
 * 클라이언트 컴포넌트에서 장바구니 항목을 DB 상품(가격·재고)과 매칭하기 위한 훅.
 *
 * 정적 PRODUCTS 배열(가격=1 플레이스홀더) 대신 Supabase 실제 가격을 사용한다.
 * 로그인 상태면 브라우저 supabase 클라이언트가 세션 JWT를 실어 보내므로
 * RLS가 student/admin 상품 노출까지 올바르게 처리한다.
 */
export function useProductMap() {
  const [map, setMap] = useState<Map<string, Product>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const products = await getAllProductsFromDb();
      if (cancelled) return;
      setMap(new Map(products.map((p) => [p.id, p])));
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { map, loading };
}
