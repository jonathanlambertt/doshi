import { router } from "expo-router";
import { NotebookPen } from "lucide-react-native";
import {
  type ComponentType,
  Fragment,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  ScrollView,
  type ScrollViewInstance,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PrimaryButton, TextButton } from "@/components/primary-button";
import { TopBar } from "@/components/top-bar";
import {
  LESSON_ESTIMATED_MINUTES,
  LESSON_WORD_COUNT,
  NEW_WORDS_PER_DAY,
  NEW_WORDS_PER_DAY_OPTIONS,
} from "@/constants/lesson";
import {
  fontFamily,
  fontSize,
  iconSize,
  letterSpacing,
  maxContentWidth,
  radius,
  spacing,
} from "@/constants/theme";
import { DICTIONARY_WORDS } from "@/data/dictionary-words";
import { useTheme } from "@/hooks/use-theme";
import { formatCount, plural } from "@/utils/format";

type Slide = {
  title: string;
  body: string;
  /** A small, decorative picture of the idea, drawn like the app's own UI. */
  Art: ComponentType;
};

const SLIDES: readonly Slide[] = [
  {
    title: `${formatCount(DICTIONARY_WORDS.length)} words to start with`,
    body: "A word list made for beginners. Each word comes with its reading and meaning.",
    Art: WordArt,
  },
  {
    title: "A few minutes a day",
    body: `Each lesson brings ${LESSON_WORD_COUNT} new words, then a quick check helps them stick.`,
    Art: LessonArt,
  },
  {
    title: "Reviews at the right time",
    body: "Words come back just before you'd forget them. Each time you remember one, it waits longer until its next review.",
    Art: ReviewArt,
  },
  {
    title: "Learn at your pace",
    body: "Choose how many new words to learn each day. You can change it any time in Settings.",
    Art: PaceArt,
  },
];

const LAST_PAGE = SLIDES.length - 1;

/**
 * What Doshi is, opened from "What is Doshi?" on the landing screen: slides to
 * swipe through, ending with a choice to create an account or try the app
 * without one.
 */
export default function TourScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const pagerRef = useRef<ScrollViewInstance>(null);
  // Slides are as wide as the pager. Start from the window width so the first
  // frame is right, then follow the pager's measured width.
  const { width: windowWidth } = useWindowDimensions();
  const [pageWidth, setPageWidth] = useState(windowWidth);
  const [page, setPage] = useState(0);
  // The page as of the last scroll event, for the resize effect below.
  const pageRef = useRef(0);
  const isLastPage = page === LAST_PAGE;

  // Keep the current slide in view when the pager is resized (e.g. iPad
  // split view); the scroll offset doesn't follow the new width on its own.
  useEffect(() => {
    pagerRef.current?.scrollTo({
      x: pageRef.current * pageWidth,
      animated: false,
    });
  }, [pageWidth]);

  const handleLayout = (event: LayoutChangeEvent) =>
    setPageWidth(event.nativeEvent.layout.width);

  // The dots follow the slide that fills most of the screen, mid-swipe too.
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, layoutMeasurement } = event.nativeEvent;
    if (layoutMeasurement.width === 0) return;
    const next = Math.round(contentOffset.x / layoutMeasurement.width);
    pageRef.current = Math.min(Math.max(next, 0), LAST_PAGE);
    setPage(pageRef.current);
  };

  const goToPage = (target: number) =>
    pagerRef.current?.scrollTo({ x: target * pageWidth, animated: true });

  const handleCreateAccount = () => router.push("/onboarding");
  // Replaces the tour rather than pushing, so Home doesn't sit on top of it.
  const handleTryWithoutAccount = () => router.replace("/home");

  return (
    <View
      style={[
        styles.screen,
        {
          backgroundColor: theme.background,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        },
      ]}
    >
      <TopBar />

      <ScrollView
        ref={pagerRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onLayout={handleLayout}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.screen}
      >
        {SLIDES.map(({ title, body, Art }) => (
          // Each slide scrolls on its own if large text makes it too tall.
          <ScrollView
            key={title}
            style={{ width: pageWidth }}
            contentContainerStyle={styles.slideScroll}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.slide}>
              <View aria-hidden>
                <Art />
              </View>
              <View style={styles.slideText}>
                <Text style={[styles.title, { color: theme.text }]}>
                  {title}
                </Text>
                <Text style={[styles.body, { color: theme.textMuted }]}>
                  {body}
                </Text>
              </View>
            </View>
          </ScrollView>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <View
          accessible
          accessibilityLabel={`Slide ${page + 1} of ${SLIDES.length}`}
          style={styles.dots}
        >
          {SLIDES.map(({ title }, index) => (
            <View
              key={title}
              style={[
                styles.dot,
                index === page && styles.dotCurrent,
                {
                  backgroundColor:
                    index === page ? theme.accent : theme.borderStrong,
                },
              ]}
            />
          ))}
        </View>

        <View style={styles.actions}>
          <PrimaryButton
            label={isLastPage ? "Create an account" : "Next"}
            onPress={
              isLastPage ? handleCreateAccount : () => goToPage(page + 1)
            }
          />
          <TextButton
            label={isLastPage ? "Try without an account" : "Skip"}
            onPress={
              isLastPage ? handleTryWithoutAccount : () => goToPage(LAST_PAGE)
            }
          />
        </View>
      </View>
    </View>
  );
}

/** A word card: the word, its reading and its meaning, with one more behind. */
function WordArt() {
  const { theme } = useTheme();
  const cardColors = {
    backgroundColor: theme.surface,
    borderColor: theme.border,
  };

  return (
    <View style={styles.wordArt}>
      <View style={[styles.card, styles.wordCardBehind, cardColors]} />
      <View style={[styles.card, styles.wordCard, cardColors]}>
        {/* Japanese text sets no fontFamily: Figtree has no Japanese glyphs. */}
        <Text lang="ja" style={[styles.wordExpression, { color: theme.text }]}>
          新しい
        </Text>
        <Text lang="ja" style={[styles.wordReading, { color: theme.textMuted }]}>
          あたらしい
        </Text>
        <View style={[styles.wordRule, { backgroundColor: theme.border }]} />
        <Text style={[styles.wordMeaning, { color: theme.text }]}>new</Text>
      </View>
    </View>
  );
}

/** Home's card for the next lesson. */
function LessonArt() {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.card,
        styles.cardStack,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}
    >
      <Text style={[styles.eyebrow, { color: theme.textMuted }]}>
        Next lesson
      </Text>
      <Text style={[styles.cardTitle, { color: theme.text }]}>
        {plural(LESSON_WORD_COUNT, "new word", "new words")}
      </Text>
      <Text style={[styles.cardDetail, { color: theme.textMuted }]}>
        About {LESSON_ESTIMATED_MINUTES} min
      </Text>
      <View style={[styles.fakeButton, { backgroundColor: theme.accent }]}>
        <NotebookPen color={theme.onAccent} size={iconSize.md} />
        <Text style={[styles.fakeButtonLabel, { color: theme.onAccent }]}>
          Start lesson
        </Text>
      </View>
    </View>
  );
}

const REVIEW_STEPS = [
  { label: "New word", when: "Today" },
  { label: "Review", when: "Days later" },
  { label: "Review", when: "Weeks later" },
  { label: "Review", when: "Months later" },
] as const;

// The line after each step grows, like the time between reviews.
const REVIEW_GAPS = [spacing.sm, spacing.xl, spacing["3xl"]] as const;

/** One word's reviews on a timeline, spreading further apart. */
function ReviewArt() {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}
    >
      {REVIEW_STEPS.map(({ label, when }, index) => (
        <Fragment key={when}>
          <View style={styles.step}>
            <View style={styles.rail}>
              <View
                style={[styles.stepDot, { backgroundColor: theme.accent }]}
              />
            </View>
            <Text style={[styles.stepLabel, { color: theme.text }]}>
              {label}
            </Text>
            <Text style={[styles.stepWhen, { color: theme.textMuted }]}>
              {when}
            </Text>
          </View>
          {index < REVIEW_GAPS.length ? (
            <View style={styles.rail}>
              <View
                style={[
                  styles.stepLine,
                  {
                    height: REVIEW_GAPS[index],
                    backgroundColor: theme.borderStrong,
                  },
                ]}
              />
            </View>
          ) : null}
        </Fragment>
      ))}
    </View>
  );
}

/** The new-words-a-day choice from Study pace, set to its default. */
function PaceArt() {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.card,
        styles.cardStack,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}
    >
      <Text style={[styles.eyebrow, { color: theme.textMuted }]}>
        New words a day
      </Text>
      <View style={styles.paceOptions}>
        {NEW_WORDS_PER_DAY_OPTIONS.map((count) => {
          const selected = count === NEW_WORDS_PER_DAY;
          return (
            <View
              key={count}
              style={[
                styles.paceOption,
                selected
                  ? { backgroundColor: theme.accent, borderColor: theme.accent }
                  : {
                      backgroundColor: theme.background,
                      borderColor: theme.border,
                    },
              ]}
            >
              <Text
                style={[
                  styles.paceLabel,
                  { color: selected ? theme.onAccent : theme.text },
                ]}
              >
                {count}
              </Text>
            </View>
          );
        })}
      </View>
      <Text style={[styles.cardDetail, { color: theme.textMuted }]}>
        {`${plural(NEW_WORDS_PER_DAY / LESSON_WORD_COUNT, "lesson", "lessons")} a day`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  slideScroll: {
    flexGrow: 1,
    justifyContent: "center",
  },
  slide: {
    alignSelf: "center",
    width: "100%",
    maxWidth: maxContentWidth,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    gap: spacing["2xl"],
  },
  slideText: {
    gap: spacing.sm,
  },
  title: {
    fontSize: fontSize.xl,
    fontFamily: fontFamily.bold,
    textAlign: "center",
  },
  body: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.regular,
    textAlign: "center",
  },
  footer: {
    alignSelf: "center",
    width: "100%",
    maxWidth: maxContentWidth,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.xl,
  },
  dots: {
    flexDirection: "row",
    alignSelf: "center",
    gap: spacing.sm,
  },
  dot: {
    width: spacing.sm,
    height: spacing.sm,
    borderRadius: radius.full,
  },
  dotCurrent: {
    width: spacing.xl,
  },
  actions: {
    gap: spacing.xs,
  },
  // Slide art
  card: {
    padding: spacing.xl,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  cardStack: {
    gap: spacing.sm,
  },
  wordArt: {
    alignSelf: "center",
  },
  wordCardBehind: {
    ...StyleSheet.absoluteFill,
    transform: [{ rotate: "6deg" }],
  },
  wordCard: {
    alignItems: "center",
    paddingHorizontal: spacing["3xl"],
    gap: spacing.xs,
  },
  wordExpression: {
    fontSize: fontSize.display,
  },
  wordReading: {
    fontSize: fontSize.lg,
  },
  wordRule: {
    alignSelf: "stretch",
    height: StyleSheet.hairlineWidth * 2,
    marginVertical: spacing.md,
  },
  wordMeaning: {
    fontSize: fontSize.lg,
    fontFamily: fontFamily.semibold,
  },
  eyebrow: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.semibold,
    letterSpacing: letterSpacing.wide,
  },
  cardTitle: {
    fontSize: fontSize.lg,
    fontFamily: fontFamily.semibold,
  },
  cardDetail: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.regular,
  },
  fakeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.lg,
    marginTop: spacing.md,
  },
  fakeButtonLabel: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.semibold,
    letterSpacing: letterSpacing.wide,
  },
  step: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  rail: {
    width: spacing.md,
    alignItems: "center",
  },
  stepDot: {
    width: spacing.md,
    height: spacing.md,
    borderRadius: radius.full,
  },
  stepLine: {
    width: StyleSheet.hairlineWidth * 2,
  },
  stepLabel: {
    flex: 1,
    fontSize: fontSize.md,
    fontFamily: fontFamily.medium,
  },
  stepWhen: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.regular,
  },
  paceOptions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  paceOption: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  paceLabel: {
    fontSize: fontSize.lg,
    fontFamily: fontFamily.semibold,
  },
});
