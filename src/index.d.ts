declare module "*.png";

declare module "*.gif";
declare module "*.svg" {
    import type React from "react";

    import { type SvgProps } from "react-native-svg";
    const content: React.FC<SvgProps>;
    export default content;
}

declare module "react-native-check-box" {
    import React, { type ReactElement } from "react";
    import { type ViewStyle, type TextStyle, type StyleProp } from "react-native";
    export interface CheckBoxProps {
        /**
         * Custom styles for the container of the checkbox.
         */
        style?: StyleProp<ViewStyle>;

        /**
         * Text displayed to the left of the checkbox.
         */
        leftText?: string;

        /**
         * Custom view to replace the left text.
         */
        leftTextView?: ReactElement;

        /**
         * Custom style for the left text.
         */
        leftTextStyle?: StyleProp<TextStyle>;

        /**
         * Text displayed to the right of the checkbox.
         */
        rightText?: string;

        /**
         * Custom view to replace the right text.
         */
        rightTextView?: ReactElement;

        /**
         * Custom style for the right text.
         */
        rightTextStyle?: StyleProp<TextStyle>;

        /**
         * Image displayed when the checkbox is checked.
         */
        checkedImage?: ReactElement;

        /**
         * Image displayed when the checkbox is unchecked.
         */
        unCheckedImage?: ReactElement;

        /**
         * Function to call when the checkbox is clicked.
         */
        onClick: () => void;

        /**
         * Whether the checkbox is checked.
         */
        isChecked: boolean;

        /**
         * Whether the checkbox is in an indeterminate state.
         */
        isIndeterminate: boolean;

        /**
         * Custom image for the indeterminate state.
         */
        indeterminateImage?: ReactElement;

        /**
         * Default color for the checkbox.
         */
        checkBoxColor?: string;

        /**
         * Color of the checkbox when it is checked.
         */
        checkedCheckBoxColor?: string;

        /**
         * Color of the checkbox when it is unchecked.
         */
        uncheckedCheckBoxColor?: string;

        /**
         * Whether the checkbox is disabled.
         */
        disabled?: boolean;
    }

    export default class CheckBox extends React.Component<CheckBoxProps> { }
}
