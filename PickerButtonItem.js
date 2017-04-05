
import React, {Component} from 'react'
import {
  Image,
  Dimensions,
  TouchableOpacity,
  Text,
  StyleSheet,
  View
} from 'react-native'

class PickerButtonItem extends Component {

  componentWillMount () {
    var {width} = Dimensions.get('window')
    var {imageMargin, imagesPerRow, containerWidth} = this.props
    if (typeof containerWidth !== 'undefined') {
      width = containerWidth
    }
    this._imageSize = (width - (imagesPerRow - 1) * imageMargin) / imagesPerRow
  }

  render () {
    const { item, imageMargin, source, text, tintColor } = this.props
    return (
      <TouchableOpacity
        style={{marginBottom: imageMargin, marginRight: imageMargin}}
        onPress={() => this._handleClick(item)}
      >
        <View style={styles.buttonContainer}>
          <View style={styles.imageContainer}>
            <Image source={source} style={[styles.image, { tintColor }]} />
          </View>
          <Text style={[styles.text, {textAlign: 'center', width: this._imageSize, color: tintColor}]}>{text}</Text>
        </View>
      </TouchableOpacity>
    )
  }

  _handleClick (item) {
    this.props.onClick(item)
  }
}

const styles = StyleSheet.create({
  image: {
    width: 40,
    height: 36,
    resizeMode: 'contain'
  },
  text: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: 'bold'
  },
  buttonContainer: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center'
  },
  imageContainer: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center'
  }
})

PickerButtonItem.propTypes = {
  item: React.PropTypes.string,
  onClick: React.PropTypes.func
}

export default PickerButtonItem
