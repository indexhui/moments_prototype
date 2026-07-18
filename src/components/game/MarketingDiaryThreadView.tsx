"use client";

import { Flex } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { DiaryOverlay } from "@/components/game/DiaryOverlay";
import { ROUTES } from "@/lib/routes";

export function MarketingDiaryThreadView() {
  const router = useRouter();

  return (
    <Flex
      data-marketing-diary-thread-route="true"
      position="relative"
      w="100%"
      h={{ base: "100dvh", lg: "852px" }}
      minH="640px"
      maxW="393px"
      overflow="hidden"
      bgColor="#F1E7D7"
    >
      <DiaryOverlay
        open
        mode="marketing-diary-thread"
        unlockedEntryIds={[]}
        onClose={() => router.push(ROUTES.gameMarketing)}
      />
    </Flex>
  );
}
