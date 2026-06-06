import React, {
  useState,
  useEffect,
  useImperativeHandle,
  forwardRef,
  useRef,
} from 'react';
import { View, ActivityIndicator, StyleSheet, Dimensions } from 'react-native';
import Svg, {
  Path,
  Text as SvgText,
  Circle,
  Rect,
  G,
  Line,
  Ellipse,
} from 'react-native-svg';
import { DOMParser } from 'xmldom';
import { Icons } from '../../assets';

type SvgElement = React.ReactElement<any>;

export interface DynamicSvgRef {
  getElementPositions: () => Record<
    string,
    { x: number; y: number; width: number; height: number }
  >;
}

interface DynamicSvgProps {
  svgXml: string;
  width?: string | number;
  height?: string | number;
  initialColor?: string;
  onElementSelected?: (id: string) => void;
  highlightedIds?: string[];
  emptybedsIds?: string[];
  alerts?: any[];
  admitPatientBed?: any[];
  wardTransferBeds?: any[];
  dischargeBeds?: any[];
  targetForWardTransferBeds?: any[];
}

const getColorByPriority = (priority: number) => {
  switch (priority) {
    case 0:
      return '#ff0000'; // critical
    case 1:
      return '#ff0000'; // high
    case 2:
      return '#ffaa00'; // medium
    case 3:
      return '#00aaff'; // low
    default:
      return '#cccccc'; // default
  }
};

const getParameterKey = (violatedParameter?: string): string => {
  if (!violatedParameter) return '';
  const [key] = violatedParameter.split(':');
  return key.trim().toUpperCase();
};

const getParameterIcon = (
  key: string,
): React.FC<{ width?: number; height?: number; fill?: string }> => {
  switch (key) {
    case 'HR':
      return Icons.hr;
    case 'SPO2':
      return Icons.spo2;
    case 'RR':
      return Icons.rr;
    case 'TEMP':
      return Icons.temp;
    case 'TEMP_S':
      return Icons.temp;
    case 'NIBP_D':
      return Icons.nibp;
    case 'NIBP_S':
      return Icons.nibp;
    case 'NIBP_M':
      return Icons.nibp;
    default:
      return Icons.default; // fallback SVG
  }
};

const DynamicSvg = forwardRef<DynamicSvgRef, DynamicSvgProps>(
  (
    {
      svgXml,
      width = Dimensions.get('window').width,
      height = Dimensions.get('window').height,
      initialColor = '#4CAE51',
      onElementSelected,
      highlightedIds = [],
      emptybedsIds = [],
      alerts = [],
      admitPatientBed = [],
      wardTransferBeds = [],
      dischargeBeds = [],
      targetForWardTransferBeds = [],
    },
    ref,
  ) => {
    const [svgElements, setSvgElements] = useState<SvgElement[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [colorMap, setColorMap] = useState<Record<string, string>>({});
    const [bedPositions, setBedPositions] = useState<
      Record<string, { centerX: number; centerY: number }>
    >({});
    const elementPositionMap = useRef<
      Record<string, { x: number; y: number; width: number; height: number }>
    >({});
    const [blinkOn, setBlinkOn] = useState(true);
    const [tappedId, setTappedId] = useState<string | null>(null);

    useEffect(() => {
      const interval = setInterval(() => {
        setBlinkOn(prev => !prev);
      }, 600); // toggle every 600ms
      return () => clearInterval(interval);
    }, []);

    useImperativeHandle(ref, () => ({
      getElementPositions: () => elementPositionMap.current,
    }));

    useEffect(() => {
      const parseSvg = () => {
        elementPositionMap.current = {};
        setBedPositions({});
        try {
          const parser = new DOMParser();
          const doc = parser.parseFromString(svgXml, 'image/svg+xml');
          const svgNode = doc.getElementsByTagName('svg')[0];
          if (!svgNode) throw new Error('Invalid SVG format');

          const elements: SvgElement[] = [];
          const newBedPositions: Record<
            string,
            { centerX: number; centerY: number }
          > = {};

          const processNode = (
            node: any,
            parentId?: string,
          ): SvgElement | null => {
            //tag name like Rect should convert to lowercase like rect
            const tagName = node.tagName?.toLowerCase();
            const id = node.getAttribute('id') || parentId;

            // Only process supported SVG elements
            if (
              !['rect', 'circle', 'path', 'g', 'text', 'line'].includes(tagName)
            )
              return null;

            // Extract attributes i.e. convert xml to JSX props
            const props: any = {};
            for (let i = 0; i < node.attributes.length; i++) {
              const attr = node.attributes[i];
              props[attr.name] = attr.value;
            }

            // Handle groups separately to find first rect
            // Beds are often represented as groups containing multiple shapes — this finds the main rectangle for position reference.
            if (tagName === 'g' && id) {
              let firstRect: {
                x: number;
                y: number;
                width: number;
                height: number;
              } | null = null;

              for (let i = 0; i < node.childNodes.length; i++) {
                const child = node.childNodes[i];
                if (
                  child.nodeType === 1 &&
                  child.tagName?.toLowerCase() === 'rect'
                ) {
                  const rectX = parseFloat(child.getAttribute('x') ?? 0);
                  const rectY = parseFloat(child.getAttribute('y') ?? 0);
                  const rectW = parseFloat(child.getAttribute('width') ?? 0);
                  const rectH = parseFloat(child.getAttribute('height') ?? 0);
                  firstRect = {
                    x: rectX,
                    y: rectY,
                    width: rectW,
                    height: rectH,
                  };

                  //Stores the rectangle’s position and size under that id.
                  //Computes the center of the bed rectangle (used for placing icons/alerts).
                  //-15 is likely a manual adjustment for better visual alignment.
                  elementPositionMap.current[id] = firstRect;
                  newBedPositions[id] = {
                    centerX: rectX + rectW / 2 - 15,
                    centerY: rectY + rectH / 2,
                  };
                  break; // only first rect
                }
              }
            }

            //When tapped, it:
            //Marks it as selected.
            //Triggers the parent’s callback (onElementSelected).
            //Updates the color map for this element.
            if (id) {
              props.onStartShouldSetResponder = () => true;
              // onPress will not work for samsung devices and some android versions while onResponderGrant works fine
              props.onResponderGrant = (e: any) => {
                // Guard against accidental multi-touch or long-press triggers
                if (e.nativeEvent.touches.length > 1) return;

                //console.log('Tapped via onResponderGrant:', id);

                // setSelectedId(id);
                // enable if you want quick flash effect on tap by setting tappedId and then clearing it shortly after
                // setTappedId(id);
                // setTimeout(() => setTappedId(null), 10);

                onElementSelected?.(id);
                // setColorMap(prev => ({ ...prev, [id]: initialColor }));
              };

              //Determines which state each bed is in, based on external data arrays.
              //Used for deciding stroke color, fill, and animation.
              // const isSelected = selectedId === id;
              const isHighlighted = highlightedIds.includes(id);
              // const shouldHighlight = isSelected || isHighlighted;
              const isEmptyBed = emptybedsIds.includes(id);
              const isAdmit = admitPatientBed.includes(id);
              const isWardTransfer = wardTransferBeds.includes(id);
              const isDischarge = dischargeBeds.includes(id);
              const isTargetForWardTransfer =
                targetForWardTransferBeds.includes(id);
              const tagAffectsVisual = ['rect', 'circle', 'path', 'line'];

              //Controls the visual highlight logic for each bed:
              //Selected or highlighted → Green border
              //Admitted → Red blinking effect
              //Ward transfer/discharge → Green blinking effect

              if (tagAffectsVisual.includes(tagName)) {
                if (id === tappedId) {
                  // ← ADD THIS BLOCK FIRST (before isHighlighted check)
                  props.fill = '#d0f0d4'; // soft green flash
                  props.stroke = '#4CAE51';
                  props.strokeWidth = 3;
                } else if (isHighlighted) {
                  props.stroke = '#4CAE51';
                  props.strokeWidth = 3;
                  props.fill = '#ffffff';
                } else if (isAdmit) {
                  // admitted → RED
                  props.stroke = '#ff1100ff';
                  props.strokeWidth = 3;
                  props.fill = blinkOn ? '#ffffff' : '#ff1100ff';
                  props.opacity = blinkOn ? 1 : 0.5;
                } else if (isWardTransfer) {
                  props.stroke = '#4CAE51';
                  props.strokeWidth = 3;
                  props.fill = blinkOn ? '#ffffff' : '#4CAE51';
                  props.opacity = blinkOn ? 1 : 0.5;
                } else if (isDischarge) {
                  props.stroke = '#4CAE51';
                  props.strokeWidth = 3;
                  props.fill = blinkOn ? '#ffffff' : '#4CAE51';
                  props.opacity = blinkOn ? 1 : 0.5;
                } else if (isTargetForWardTransfer) {
                  props.stroke = '#dadd2aff';
                  props.strokeWidth = 3;
                  props.fill = '#dadd2aff';
                } else {
                  props.stroke = props.stroke || '#000';
                  props.strokeWidth = 1;
                }
              }
            }

            //For every <g> or container element, recursively process its child nodes.
            //Builds a React element tree mirroring the original SVG structure.
            const children: any[] = [];
            for (let i = 0; i < node.childNodes.length; i++) {
              const child = node.childNodes[i];
              if (child.nodeType === 1) {
                const childEl = processNode(child, id);
                if (childEl) children.push(childEl);
              }
            }

            //Returns the corresponding JSX element for each SVG tag.
            //The key ensures React can track elements efficiently.
            switch (tagName) {
              case 'rect':
                return <Rect key={id} {...props} />;
              case 'circle':
                return <Circle key={id} {...props} />;
              case 'path':
                return <Path key={id} {...props} />;
              case 'g':
                return (
                  <G key={id} {...props}>
                    {children}
                  </G>
                );
              case 'text':
                return (
                  <SvgText key={id} {...props}>
                    {node.textContent}
                  </SvgText>
                );
              case 'line':
                return <Line key={id} {...props} />;
              default:
                return null;
            }
          };

          for (let i = 0; i < svgNode.childNodes.length; i++) {
            const node = svgNode.childNodes[i];
            if (node.nodeType === 1) {
              const element = processNode(node);
              if (element) elements.push(element);
            }
          }

          setBedPositions(newBedPositions);
          setSvgElements(elements);
        } catch (error) {
          console.error('Error parsing SVG:', error);
        } finally {
          setLoading(false);
        }
      };

      parseSvg();
    }, [
      svgXml,
      initialColor,
      selectedId,
      colorMap,
      highlightedIds,
      emptybedsIds,
      blinkOn,
      tappedId,
      admitPatientBed,
      wardTransferBeds,
      dischargeBeds,
      targetForWardTransferBeds,
    ]);

    const renderTransformIcons = () => {
      return emptybedsIds.map(id => {
        const position = bedPositions[id];
        if (!position) return null;

        return (
          <G
            key={`${id}-transform`}
            transform={`translate(${position.centerX},${position.centerY}) scale(1.5)`}
          >
            <Path
              d="M6.41659 6.125C6.05399 6.125 5.69953 6.22764 5.39804 6.41993C5.09655 6.61222 4.86157 6.88553 4.72281 7.2053C4.58405 7.52507 4.54774 7.87694 4.61848 8.21641C4.68922 8.55587 4.86383 8.86769 5.12022 9.11244C5.37662 9.35718 5.70329 9.52385 6.05892 9.59137C6.41455 9.6589 6.78318 9.62424 7.11817 9.49179C7.45317 9.35934 7.7395 9.13503 7.94095 8.84725C8.1424 8.55946 8.24992 8.22112 8.24992 7.875M20.1666 14.875V12.25M20.1666 12.25H16.4999M20.1666 12.25V10.5C20.1666 9.80381 19.8769 9.13613 19.3611 8.64384C18.8454 8.15156 18.1459 7.875 17.4166 7.875H11.9166M1.83325 12.25H12.8333H10.9999V10.5M1.83325 7V14.875M2.74992 2.625L19.2499 18.375"
              stroke="#4CEA51"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </G>
        );
      });
    };

    const renderAlerts = () => {
      if (!alerts || alerts.length === 0) return null;

      // 1. Keep only ONE latest alert per bedCode
      const latestAlertsByBed: Record<string, any> = {};

      alerts.forEach(alert => {
        const bedId = alert.bedCode;
        if (!bedId) return;

        // If no alert stored OR the current one is more recent → replace
        if (
          !latestAlertsByBed[bedId] ||
          alert.timestamp > latestAlertsByBed[bedId].timestamp
        ) {
          latestAlertsByBed[bedId] = alert;
        }
      });

      // 2. Render only the deduped alerts
      return Object.values(latestAlertsByBed).map((alert: any, idx) => {
        const bedId = alert.bedCode;
        const position = bedPositions[bedId];
        if (!position) return null;

        const paramKey = getParameterKey(alert.violatedParameter);
        const IconComponent = getParameterIcon(paramKey);
        const priorityColor = getColorByPriority(alert.priority);

        return (
          <G
            key={`alert-${bedId}`}
            transform={`translate(${position.centerX},${position.centerY}) scale(1.2)`}
          >
            <IconComponent width={24} height={24} fill={priorityColor} />
          </G>
        );
      });
    };

    if (loading) {
      return (
        <View style={styles.container}>
          <ActivityIndicator size="large" />
        </View>
      );
    }

    return (
      <View style={styles.container}>
        <Svg viewBox="0 0 1000 600" width={width} height={height}>
          {svgElements}
          {renderTransformIcons()}
          {renderAlerts()}
        </Svg>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default DynamicSvg;
