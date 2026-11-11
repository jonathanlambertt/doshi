import { Check, type LucideIcon } from "lucide-react-native";
import { StyleSheet, View } from "react-native";

import { ListRow, ListSection } from "@/components/list-row";
import { iconSize } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

export type Choice<T> = {
  value: T;
  label: string;
  /** Leading icon; give every choice in a section one, or none. */
  icon?: LucideIcon;
  /** Muted text at the trailing edge, e.g. what the choice costs. */
  detail?: string;
};

type ChoiceSectionProps<T> = {
  title: string;
  footnote?: string;
  choices: readonly Choice<T>[];
  /** Null when nothing is chosen yet (e.g. the kana question unanswered). */
  selected: T | null;
  onSelect: (value: T) => void;
};

/** A titled group of radio rows; the selected one shows a checkmark. */
export function ChoiceSection<T extends string | number | null>({
  title,
  footnote,
  choices,
  selected,
  onSelect,
}: ChoiceSectionProps<T>) {
  const { theme } = useTheme();

  return (
    <ListSection title={title} footnote={footnote}>
      {choices.map(({ value, label, icon, detail }, index) => {
        const isSelected = value === selected;
        return (
          <ListRow
            key={String(value)}
            icon={icon}
            label={label}
            value={detail}
            accessibilityRole="radio"
            selected={isSelected}
            onPress={() => onSelect(value)}
            trailing={
              // An empty slot when unselected keeps the details aligned.
              isSelected ? (
                <Check color={theme.text} size={iconSize.md} />
              ) : (
                <View style={styles.checkSlot} />
              )
            }
            first={index === 0}
            last={index === choices.length - 1}
          />
        );
      })}
    </ListSection>
  );
}

const styles = StyleSheet.create({
  checkSlot: {
    width: iconSize.md,
  },
});
