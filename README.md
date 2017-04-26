# Colormind pix2pix

my fork of [pix2pix](https://github.com/phillipi/pix2pix) that's used for http://colormind.io

The main difference is that the Unet in models.lua accepts 32x1 images instead of 256x256 images.

The included generate.js is a nodejs script that generates A/B image pairs for training from a json palette dataset:

```
dataset.json

[
[[14,232,123],[47,36,73],[0,0,255],[137,25,108],[227,197,63]],
[[19,255,139],[0,12,255],[122,0,110],[56,50,90],[211,237,247]],
[[120,8,83],[4,13,238],[17,222,104],[25,56,57],[238,226,241]],
[[85,13,77],[109,0,132],[0,0,255],[27,234,131],[238,255,242]],
[[47,60,71],[113,0,123],[14,6,255],[15,202,120],[222,248,255]],
[[0,255,219],[10,20,232],[135,2,112],[79,67,105],[174,196,200]]
]

used like this: node generate.js dataset.json [i] [k]

where [i] is a directory suffix and [k] is the number of rows to use as a ratio (0->1)

eg. training:

node generate.js dataset.json 1 0.5
python scripts/combine_A_and_B.py --fold_A ./aggregate/A1 --fold_B ./aggregate/B1 --fold_AB ./aggregate/AB1
DATA_ROOT=./aggregate/AB1 name=palette which_direction=BtoA gpu=0 cudnn=0 th train.lua

feed forward:
DATA_ROOT=./aggregate/AB1 name=palette which_direction=BtoA gpu=0 cudnn=0 phase=test th test.lua
```

note: reduce ngf and ndf parameters to reduce model size (as well as output quality)