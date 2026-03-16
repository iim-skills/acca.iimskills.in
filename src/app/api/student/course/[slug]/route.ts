import { NextResponse } from "next/server";
import db from "../../../../../lib/db";

export async function GET(req:Request){

  try{

    const {searchParams} = new URL(req.url);

    const slug = searchParams.get("slug");

    const [rows]:any = await db.query(
      `SELECT * FROM courses WHERE slug=?`,
      [slug]
    );

    if(!rows.length){
      return NextResponse.json({success:false});
    }

    const course = rows[0];

    const courseData = JSON.parse(course.courseData);

    return NextResponse.json({

      success:true,

      course:{
        courseId:course.courseId,
        slug:course.slug,
        name:course.name,
        description:course.description,
        modules:courseData.modules
      }

    });

  }catch(error){

    console.error(error);

    return NextResponse.json(
      {success:false},
      {status:500}
    );

  }

}