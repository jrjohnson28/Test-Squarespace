Y.use('node', 'squarespace-gallery-ng', function(Y) {
  Y.on('domready', function() {

    // FUNCTIONS
    var body = Y.one('body');
    var bodyWidth = parseInt(body.getComputedStyle('width'),10);

    var slideshow;


    // FOLDER DROPDOWNS //////////////////////////////////
    Y.one('#topNav').delegate('click', function(e){
      e.currentTarget.toggleClass('folder-open');
    }, '.folder');

    // Mobile Nav ///////////////////////////////////

     Y.one('#mobileMenuLink a').on('click', function(e){
       var mobileMenuHeight = parseInt(Y.one('#mobileNav .wrapper').get('offsetHeight'),10);
       if (Y.one('#mobileNav').hasClass('menu-open')) {
         new Y.Anim({ node: Y.one('#mobileNav'), to: { height: 0 }, duration: 0.5, easing: 'easeBoth' }).run();
       } else {
         new Y.Anim({ node: Y.one('#mobileNav'), to: { height: mobileMenuHeight }, duration: 0.5, easing: 'easeBoth' }).run();
       }

       Y.one('#mobileNav').toggleClass('menu-open');
     });


    // GALLERY PAGES ///////////////////////////////////////////////////


    if (Y.one('body').hasClass('collection-type-gallery')) {

      if (Y.one('.gallery-view-start-on-grid')) toggleGridVisibility();

      gallerySlideshow();

      Y.one('#gridButton').on('click', function(e) {
        toggleGridVisibility();
      });

      var thumbList = Y.all('#thumbnails .thumb');
      Y.one('#thumbnails').delegate('click', function(e) {
        slideshow.set('currentIndex',thumbList.indexOf(e.currentTarget));
        toggleGridVisibility();
      }, '.thumb');

      if (Y.Squarespace.Management) {
        Y.Squarespace.Management.on('tweak', function(f) {
          if (f.getName() == 'siteWidth' || f.getName() == 'galleryHeight' || f.getName() == 'header-position') {
            slideshow.fire('refresh');
          }
          if (f.getName() == 'gallery-view') {
            toggleGridVisibility();
          }
        });
      }

      Y.Global.on('tweak:reset', function(f){
        slideshow.fire('refresh');
      });

      Y.one('window').on('resize', function(e) {
        slideshow.fire('refresh');
        Y.all('.slide img[data-src]' ).each(function(img) {
          img.fire('refresh');
        });
      });

    }

    function gallerySlideshow() {

      if (bodyWidth < 800) {

        Y.all('.slide img[data-src]').each(function(img) {
          ImageLoader.load(img, { load: true });
        });

        Y.all('.slide .sqs-video-wrapper').each(function(video) {
          video.plug(Y.Squarespace.VideoLoader);
        });


      } else if (Y.one('#slideshowWrapper .slide')) {

        var maxHeight = parseInt(Y.Squarespace.Template.getTweakValue('galleryHeightMax'),10);

        // slideshow gallery
        slideshow = new Y.Squarespace.Gallery2({
          container: '#slideshow',
          loop: true,
          keyboard: {
            next: 'down:39',
            previous: 'down:37'
          },
          elements: {
            next: '.next-slide',
            previous: '.prev-slide',
            currentIndex: '.current-index',
            totalSlides: '.total-slides'
          },
          design: 'stacked',
          designOptions: {
            speed: 0.5,
            easing: Y.Easing.easeOutStrong,
            transition: 'fade',
            autoHeight: false
          },
          historyHash: true
        });

        // linked gallery = thumbnails
        var thumbnails;
        thumbnails = new Y.Squarespace.Gallery2({
          container: '#thumbnails',
          currentIndex: slideshow.get('currentIndex'),
          loop: true,
          keyboard: false,
          design: 'base'
        });

        slideshow.addChild(thumbnails);

        // Adjust slideshow container height
        var adjustHeight = Y.bind(function(currentIndex, bAnim) {
          var slideshowWrapper = Y.one('#slideshowWrapper'),
              slideContent = slideshow.get('slides').item(currentIndex).one('img, .sqs-video-wrapper'),
              dims = slideContent.videoloader ? {
                      width: slideContent.videoloader.getWidth(),
                      height: slideContent.videoloader.getHeight()
                    } : Y.Squarespace.Rendering.getDimensionsFromNode(slideContent),
              targetWidth = slideContent.videoloader ? slideshowWrapper.width() : Math.min(slideshowWrapper.width(), dims.width),
              targetHeight = Y.Squarespace.Rendering.getHeightForWidth(dims.width, dims.height, targetWidth);

          targetHeight = Math.ceil(Math.min(targetHeight, maxHeight));

          if (isNaN(targetHeight)) return;
          
          if (bAnim) {
            slideshowWrapper.anim({}, {
              to: {
                height: targetHeight
              },
              duration: 0.3,
              easing: Y.Easing.easeInOutQuad
            }).run().on('end', function() { slideContent.fire('refresh'); });
          } else {
            slideshowWrapper.setStyle('height', targetHeight + 'px');
          }
        }, this);
        adjustHeight(slideshow.get('currentIndex'), false);

        Y.all('#imageData .slide').item(slideshow.get('currentIndex')).addClass('active');

        slideshow.on('currentIndexChange', function(e) {
          var currentIndex = e.newVal >= 0 ? e.newVal : slideshow.get('slides').size() + e.newVal;
          adjustHeight(currentIndex, true);
          Y.all('#imageData .slide').item(currentIndex).addClass('active').siblings().removeClass('active');
        });
        
      }
    }


    function toggleGridVisibility() {

      if (Y.one('#pageWrapper').hasClass('grid-visible')) {
        Y.one('#thumbnails').anim({opacity:0}).run();
        Y.one('#pageWrapper').toggleClass('grid-visible');
        scrollToTop();
        Y.one('#galleryWrapper').setStyle('visibility', 'visible');
        Y.one('#galleryWrapper').setStyle('overflow', 'visible');
        Y.one('#galleryWrapper').setStyle('height', 'auto');
        Y.one('#galleryWrapper').anim({opacity:1}).run();
      } else {
        Y.one('#galleryWrapper').anim({opacity:0}).run();
        Y.one('#galleryWrapper').setStyle('visibility', 'hidden');
        Y.one('#galleryWrapper').setStyle('overflow', 'hidden');
        Y.one('#galleryWrapper').setStyle('height', '0px');
        Y.one('#pageWrapper').toggleClass('grid-visible');
        Y.one('#thumbnails').anim({opacity:1}).run();
      }
    }

    function scrollToTop() {
      var scrollNodes = Y.UA.gecko ? 'html' : 'body';
      new Y.Anim({ node: scrollNodes, to: { scroll: [0,0] }, duration: 0.9, easing: 'easeBoth' }).run();
    }

    function logoSpacerSizing() {
      var logo = Y.one('h1.logo'), logoSpacer = Y.one('#logoSpacer .logo');
      if (logo.hasAttribute('style')) {
        var logoStyles = logo.getAttribute('style');
        logoSpacer && logoSpacer.setAttribute('style', logoStyles);
      }
    }
    logoSpacerSizing();
    Y.on('windowresize', function() {
      logoSpacerSizing();
    });

  });
});


Y.use('node', function () {
  window.Site = Singleton.create({

    ready: function () {

      Y.on('domready', function () {
        this.bindUI();
        this.syncUI();
      }, this);

    },

    bindUI: function () {

      // Bind event handlers here.

      Y.one(window).on('resize', this.syncUI, this);

    },

    syncUI: function () {

      // Sync events here.

      // You'd want to call this on window resize
      // or after an ajax call.

      this.horizontalFolderFix();

    },

    // Tablet Nav //////////////////////////////////////////////////////
    horizontalFolderFix: function () {
      
      var canvasWidth = Y.one('#canvas').get('clientWidth');
      
      if (canvasWidth <= 800) {
        // Mobile menu
        Y.one('body').removeAttribute('data-menu');
        Y.one('body').setAttribute('data-menu', 'mobile');
      } else if (canvasWidth <= 1024) {
        // Tablet menu
        Y.one('body').removeAttribute('data-menu');
        Y.one('body').setAttribute('data-menu', 'tablet');

        Y.one('#mainNavigation').delegate('click', function (e) {
          // Close any other open folders when opening the clicked folder.
          e.currentTarget.siblings('.folder-collection').removeClass('folder-open');

          var activeDisplay = Y.one('.active-folder .subnav').getStyle('display');
          console.log(activeDisplay);

          if ( activeDisplay == 'none' ) {
            Y.one('.active-folder .subnav').setStyle('display', 'block');
          } else if ( e.currentTarget.siblings().hasClass('.active-folder') ) {
            Y.one('.active-folder .subnav').setStyle('display', 'none');
          }

        }, '.folder-collection', this);
      } else {
        // Desktop menu
        Y.one('body').removeAttribute('data-menu');
        Y.one('body').setAttribute('data-menu', 'desktop');
      }
    }

  });
});