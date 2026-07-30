"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { wishlistService } from "@/services/wishlist.service";

export function useWishlist() {
  return useQuery({
    queryKey: ["wishlist"],
    queryFn: () => wishlistService.mine(),
  });
}

export function useToggleWishlist(eventId: number, slug?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (saved: boolean) => {
      if (saved) await wishlistService.remove(eventId);
      else await wishlistService.add(eventId);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["wishlist"] });
      if (slug) void qc.invalidateQueries({ queryKey: ["events", slug] });
    },
  });
}
