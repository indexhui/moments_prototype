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
  borderColor,
}: {
  filled: number;
  total: number;
  fillColor: string;
  emptyColor: string;
  borderColor: string;
}) {
  const safeFilled = Math.max(0, Math.min(total, filled));
  return (
    <Flex
      w="46px"
      display="grid"
      gridTemplateColumns="repeat(3, 12px)"
      gridTemplateRows="repeat(2, 12px)"
      gap="5px"
      flexShrink={0}
    >
      {Array.from({ length: total }).map((_, index) => (
        <Flex
          key={index}
          w="12px"
          h="12px"
          borderRadius="999px"
          bgColor={index < safeFilled ? fillColor : emptyColor}
          border={`1px solid ${borderColor}`}
          boxShadow={index < safeFilled ? "0 0 0 1px rgba(255,255,255,0.35) inset" : "none"}
        />
      ))}
    </Flex>
  );
}

function ResourceMeter({
  icon,
  label,
  value,
  total,
  fillColor,
  emptyColor,
  iconBg,
  iconColor,
}: {
  icon: string;
  label: string;
  value: number;
  total: number;
  fillColor: string;
  emptyColor: string;
  iconBg: string;
  iconColor: string;
}) {
  const safeValue = Math.max(0, Math.min(total, value));
  return (
    <Flex alignItems="center" gap="8px">
      <Flex direction="column" alignItems="center" gap="4px" minW="40px">
        <Flex
          w="36px"
          h="36px"
          flexShrink={0}
          borderRadius="9px"
          border="1px solid rgba(93, 74, 56, 0.45)"
          bg={iconBg}
          alignItems="center"
          justifyContent="center"
        >
          <Text color={iconColor} fontWeight="700" fontSize="14px" lineHeight="1">
            {icon}
          </Text>
        </Flex>
        <Text color="#735841" fontSize="10px" fontWeight="700" lineHeight="1">
          {label}
        </Text>
      </Flex>
      <Flex direction="column" gap="3px" alignItems="flex-start">
        <DotMeter
          filled={safeValue}
          total={total}
          fillColor={fillColor}
          emptyColor={emptyColor}
          borderColor="rgba(120, 97, 73, 0.28)"
        />
        <Text color="#5F4936" fontSize="11px" fontWeight="700" minW="30px">
          {safeValue}/{total}
        </Text>
      </Flex>
    </Flex>
  );
}

function NumericResourceBadge({
  icon,
  label,
  value,
  iconBg,
  iconColor,
  valueBg,
  valueColor,
}: {
  icon: string;
  label: string;
  value: number;
  iconBg: string;
  iconColor: string;
  valueBg: string;
  valueColor: string;
}) {
  const safeValue = Math.max(0, value);
  return (
    <Flex alignItems="center" gap="8px">
      <Flex direction="column" alignItems="center" gap="4px" minW="40px">
        <Flex
          w="36px"
          h="36px"
          flexShrink={0}
          borderRadius="9px"
          border="1px solid rgba(93, 74, 56, 0.45)"
          bg={iconBg}
          alignItems="center"
          justifyContent="center"
        >
          <Text color={iconColor} fontWeight="700" fontSize="14px" lineHeight="1">
            {icon}
          </Text>
        </Flex>
        <Text color="#735841" fontSize="10px" fontWeight="700" lineHeight="1">
          {label}
        </Text>
      </Flex>
      <Flex
        minW="56px"
        h="36px"
        px="10px"
        borderRadius="10px"
        bgColor={valueBg}
        border="1px solid rgba(123, 95, 71, 0.25)"
        alignItems="center"
        justifyContent="center"
        flexShrink={0}
      >
        <Text color={valueColor} fontSize="16px" fontWeight="800">
          {safeValue}
        </Text>
      </Flex>
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
        minH="72px"
        borderRadius="14px"
        border="2px solid #A98565"
        bgColor="#F6F2EA"
        alignItems="center"
        justifyContent="space-between"
        px="10px"
        gap="8px"
      >
        <NumericResourceBadge
          icon="$"
          label="儲蓄"
          value={savings}
          iconBg="linear-gradient(180deg, #F7E8A1 0%, #EBC95E 100%)"
          iconColor="#6A4A1D"
          valueBg="rgba(240,201,74,0.18)"
          valueColor="#6A4A1D"
        />

        <ResourceMeter
          icon="步"
          label="行動力"
          value={actionPower}
          total={6}
          fillColor="#42B3A0"
          emptyColor="#D4E4DF"
          iconBg="linear-gradient(180deg, #BFE8E0 0%, #84D4C7 100%)"
          iconColor="#265A52"
        />

        <Flex
          px="8px"
          h="38px"
          borderRadius="10px"
          bgColor="rgba(123, 95, 71, 0.16)"
          border="1px solid rgba(123, 95, 71, 0.25)"
          alignItems="center"
          justifyContent="center"
          flexShrink={0}
        >
          <Text color="#6E533D" fontSize="13px" fontWeight="700">
            疲勞 {fatigue}
          </Text>
        </Flex>
      </Flex>
    </Flex>
  );
}
