
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
        <View style={{ flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <View style={[styles.imageWrapper, {height: this._imageSize, width: this._imageSize}]}>
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
  imageWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1
  },
  text: {
    fontSize: 14,
    fontWeight: 'bold'
  }
})

PickerButtonItem.propTypes = {
  item: React.PropTypes.string,
  onClick: React.PropTypes.func
}

export default PickerButtonItem
