# Shopify-Challenge-2019
##Working of the app: -
Routes: -
1. GET /
Basic homepage. Will welcome the user or will display the greeting message.
2. POST /register/?username=rassy&email=rassy@sfu.ca&password=whatever
You can register using this route. Be careful with the syntax.
3. Post /login/?username=rabcdcdscn&password=whatever
You can login using this route.
NOTE:- LOGIN and REGISTER are basically for maintaining the carts.
4. GET /logout
Basic logout from the system.
5. GET /allproducts
This will give you the relevant information of the product available in the inventory.
6. POST /buy/?title=whatever&quantity
You can add stuff in your cart using this.
7. GET /productinfo/?title=whatever
This will give you the relevant information of the product you are looking for.
8. GET /mycart
It will display all the items that are in your cart at the moment.
9. GET /completecart
By using this you are authorizing that you are buying all the products that are there in your cart.
