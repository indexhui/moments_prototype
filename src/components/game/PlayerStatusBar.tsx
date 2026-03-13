import { Flex, Text } from "@chakra-ui/react";

type PlayerStatusBarProps = {
  savings: number;
  actionPower: number;
  fatigue: number;
};

function DotMeter({
  filled,
  total,
  fillColor,
  emptyColor,
}: {
  filled: number;
  total: number;
  fillColor: string;
  emptyColor: string;
}) {
  return (
    <Flex
      w="38px"
      display="grid"
      gridTemplateColumns="repeat(3, 10px)"
      gridTemplateRows="repeat(2, 10px)"
      gap="4px"
      flexShrink={0}
    >
      {Array.from({ length: total }).map((_, index) => (
        <Flex
          key={index}
          w="10px"
          h="10px"
          borderRadius="999px"
          bgColor={index < filled ? fillColor : emptyColor}
          border="1px solid rgba(157, 120, 89, 0.25)"
        />
      ))}
    </Flex>
  );
}

export function PlayerStatusBar({
  savings,
  actionPower,
  fatigue,
}: PlayerStatusBarProps) {
  return (
    <Flex p="8px 12px" bgColor="#EDE7DE" borderBottom="1px solid rgba(157,120,89,0.25)">
      <Flex
        w="100%"
        h="64px"
        borderRadius="14px"
        border="2px solid #A98565"
        bgColor="#F6F2EA"
        alignItems="center"
        justifyContent="space-between"
        px="10px"
      >
        <Text fontSize="26px">👧🏻</Text>

        <Flex
          w="44px"
          h="44px"
          flexShrink={0}
          borderRadius="10px"
          border="2px solid #A98565"
          alignItems="center"
          justifyContent="center"
          color="#7B5F47"
          fontWeight="700"
        >
          $
        </Flex>
        <DotMeter filled={savings} total={6} fillColor="#F2DE66" emptyColor="#F1E8B9" />

        <Flex
          w="44px"
          h="44px"
          flexShrink={0}
          borderRadius="10px"
          border="2px solid #A98565"
          alignItems="center"
          justifyContent="center"
          color="#7B5F47"
          fontWeight="700"
        >
          步
        </Flex>
        <DotMeter filled={actionPower} total={6} fillColor="#7DD6C5" emptyColor="#CAEAE4" />

        <Text color="#7B5F47" fontSize="18px" fontWeight="700" flexShrink={0}>
          疲勞：{fatigue}
        </Text>
      </Flex>
    </Flex>
  );
}

